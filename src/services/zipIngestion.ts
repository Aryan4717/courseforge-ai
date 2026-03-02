import JSZip from 'jszip'
import {
  createCourse,
  createSection,
  createAsset,
  uploadAssetFile,
} from '@/services/courses'
import { supabase } from '@/services/supabase'

const BATCH_SIZE = 15

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

function getTypeFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_TO_TYPE[ext] ?? 'file'
}

export type ParsedSection = { title: string }
export type ParsedAsset = { sectionIndex: number; path: string; name: string; type: string }

export type ZipStructure = {
  courseTitle: string
  sections: ParsedSection[]
  assets: ParsedAsset[]
}

/**
 * ZIP convention: root has one folder (course folder) = course title.
 * Its subfolders = sections (order by name). Files inside each = assets.
 * Root-level files inside course folder go into a "Resources" section.
 */
export function getStructure(zip: JSZip): ZipStructure {
  const paths = Object.keys(zip.files).filter((p) => !p.endsWith('/'))
  if (paths.length === 0) {
    return { courseTitle: 'Untitled Course', sections: [], assets: [] }
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

export async function loadZip(blob: Blob): Promise<JSZip> {
  return JSZip.loadAsync(blob)
}

export async function extractFile(zip: JSZip, path: string): Promise<Blob> {
  const file = zip.files[path]
  if (!file || file.dir) {
    throw new Error(`Not a file: ${path}`)
  }
  return file.async('blob')
}

export type ProcessProgress = {
  phase: 'sections' | 'assets'
  current: number
  total: number
}

export async function processZipIntoCourse(
  zipBlob: Blob,
  courseTitleOverride?: string,
  onProgress?: (p: ProcessProgress) => void
): Promise<{ courseId: string }> {
  const zip = await loadZip(zipBlob)
  const { courseTitle, sections, assets } = getStructure(zip)
  const title = courseTitleOverride?.trim() || courseTitle

  const course = await createCourse({
    title,
    description: null,
    level: null,
  })
  if (!course) throw new Error('Failed to create course')
  const courseId = course.id

  for (let i = 0; i < sections.length; i++) {
    await createSection({
      course_id: courseId,
      title: sections[i].title,
      order: i,
    })
  }

  const sectionIds = await fetchSectionIdsForCourse(courseId)
  if (sectionIds.length !== sections.length) {
    throw new Error('Failed to create some sections')
  }

  const total = assets.length
  for (let start = 0; start < assets.length; start += BATCH_SIZE) {
    const batch = assets.slice(start, start + BATCH_SIZE)
    onProgress?.({ phase: 'assets', current: start, total })

    for (const asset of batch) {
      const blob = await extractFile(zip, asset.path)
      const sectionId = sectionIds[asset.sectionIndex]
      const url = await uploadAssetFile(
        courseId,
        sectionId,
        asset.name,
        blob
      )
      await createAsset({
        section_id: sectionId,
        name: asset.name,
        type: asset.type,
        url,
      })
    }
  }
  onProgress?.({ phase: 'assets', current: total, total })

  return { courseId }
}

async function fetchSectionIdsForCourse(courseId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('course_sections')
    .select('id')
    .eq('course_id', courseId)
    .order('order', { ascending: true })

  if (error) throw error
  return (data ?? []).map((r) => r.id)
}
