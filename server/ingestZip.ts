import JSZip from 'jszip'
import { supabaseAdmin } from './supabase.js'
import { validateCourseAssetForInsert } from './createCourse.js'

const BUCKET = 'course-assets'
const MAX_FILES = 100

const EXTENSION_TO_TYPE: Record<string, string> = {
  mp4: 'video',
  webm: 'video',
  mov: 'video',
  pdf: 'document',
  doc: 'document',
  docx: 'document',
  mp3: 'audio',
  wav: 'audio',
  m4a: 'audio',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
}

const EXTENSION_TO_MIME: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
}

function getTypeFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_TO_TYPE[ext] ?? 'file'
}

function getContentType(fileName: string): string | undefined {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_TO_MIME[ext]
}

type ParsedSection = { title: string }
type ParsedAsset = { sectionIndex: number; path: string; name: string; type: string }

type ZipStructure = {
  courseTitle: string
  sections: ParsedSection[]
  assets: ParsedAsset[]
}

function getStructure(zip: JSZip): ZipStructure {
  const paths = Object.keys(zip.files).filter((p) => !p.endsWith('/'))
  if (paths.length === 0) {
    return { courseTitle: 'Untitled Course', sections: [], assets: [] }
  }
  if (paths.length > MAX_FILES) {
    throw new Error(`Too many files (max ${MAX_FILES})`)
  }

  const parts = paths.map((p) => p.split('/').filter(Boolean))
  const depth = Math.min(...parts.map((p) => p.length))
  let courseTitle = 'Untitled Course'
  const sectionTitleToIndex = new Map<string, number>()
  const sectionOrder: string[] = []
  const assets: ParsedAsset[] = []

  if (depth === 1) {
    const firstPart = new Set(parts.map((p) => p[0]))
    if (firstPart.size === 1) {
      courseTitle = parts[0][0]
    }
  }

  for (const path of paths) {
    const segs = path.split('/').filter(Boolean)
    if (segs.length === 1) {
      if (!sectionTitleToIndex.has('Resources')) {
        sectionTitleToIndex.set('Resources', sectionOrder.length)
        sectionOrder.push('Resources')
      }
      assets.push({
        sectionIndex: sectionTitleToIndex.get('Resources')!,
        path,
        name: segs[0],
        type: getTypeFromFileName(segs[0]),
      })
      continue
    }
    if (segs.length === 2) {
      const [folder, file] = segs
      courseTitle = folder
      if (!sectionTitleToIndex.has('Resources')) {
        sectionTitleToIndex.set('Resources', sectionOrder.length)
        sectionOrder.push('Resources')
      }
      assets.push({
        sectionIndex: sectionTitleToIndex.get('Resources')!,
        path,
        name: file,
        type: getTypeFromFileName(file),
      })
      continue
    }
    if (segs.length >= 3) {
      const [maybeCourse, sectionName, ...fileSegs] = segs
      if (sectionOrder.length === 0) {
        courseTitle = maybeCourse
      }
      const sectionTitle = sectionName
      if (!sectionTitleToIndex.has(sectionTitle)) {
        sectionTitleToIndex.set(sectionTitle, sectionOrder.length)
        sectionOrder.push(sectionTitle)
      }
      const fileName = fileSegs.join('/')
      assets.push({
        sectionIndex: sectionTitleToIndex.get(sectionTitle)!,
        path,
        name: fileName,
        type: getTypeFromFileName(fileName),
      })
    }
  }

  const sections: ParsedSection[] = sectionOrder.map((title) => ({ title }))
  return { courseTitle, sections, assets }
}

export async function ingestZip(buffer: Buffer): Promise<{
  courseId: string
  fileNames: string[]
}> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not configured')
  }

  const zip = await JSZip.loadAsync(buffer)
  const { courseTitle, sections, assets } = getStructure(zip)

  const { data: course, error: courseError } = await supabaseAdmin
    .from('courses')
    .insert({
      title: courseTitle,
      description: null,
      level: null,
    })
    .select('id')
    .single()

  if (courseError || !course) {
    console.error('ingestZip course insert:', courseError)
    throw new Error(courseError?.message ?? 'Failed to create course')
  }

  const courseId = course.id as string

  for (let i = 0; i < sections.length; i++) {
    const { error: sectionError } = await supabaseAdmin
      .from('course_sections')
      .insert({
        course_id: courseId,
        title: sections[i].title,
        order: i,
      })

    if (sectionError) {
      console.error('ingestZip section insert:', sectionError)
      throw new Error(sectionError.message)
    }
  }

  const sectionIdsResult = await supabaseAdmin
    .from('course_sections')
    .select('id')
    .eq('course_id', courseId)
    .order('order', { ascending: true })

  if (sectionIdsResult.error || !sectionIdsResult.data?.length) {
    throw new Error('Failed to fetch section IDs')
  }

  const sectionIds = sectionIdsResult.data.map((r) => r.id as string)
  const fileNames: string[] = []

  for (const asset of assets) {
    const entry = zip.files[asset.path]
    if (!entry || entry.dir) continue

    const blob = await entry.async('nodebuffer')
    const sectionId = sectionIds[asset.sectionIndex]
    const path = `${courseId}/${sectionId}/${asset.name}`

    const contentType = getContentType(asset.name)
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, blob, { upsert: true, contentType })

    if (uploadError) {
      console.error('ingestZip storage upload:', uploadError)
      throw new Error(uploadError.message)
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

    validateCourseAssetForInsert(asset.type, undefined, publicUrl)

    const { error: assetError } = await supabaseAdmin.from('course_assets').insert({
      section_id: sectionId,
      name: asset.name,
      type: asset.type,
      url: publicUrl,
    })

    if (assetError) {
      console.error('ingestZip asset insert:', assetError)
      throw new Error(assetError.message)
    }

    fileNames.push(asset.name)
  }

  return { courseId, fileNames }
}
