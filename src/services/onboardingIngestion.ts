import JSZip from 'jszip'
import {
  createCourse,
  createSection,
  createAsset,
  uploadAssetFile,
} from '@/services/courses'
import { supabase } from '@/services/supabase'
import { generateMetadata, structureSections } from '@/services/llmApi'
import { loadZip, extractFile, type ProcessProgress } from '@/services/zipIngestion'

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

/**
 * Returns base names of all files in the ZIP (no directories).
 * Used as input to generateMetadata and structureSections.
 */
export function getFileNamesFromZip(zip: JSZip): string[] {
  const names: string[] = []
  for (const path of Object.keys(zip.files)) {
    if (path.endsWith('/')) continue
    const segs = path.split('/').filter(Boolean)
    const baseName = segs[segs.length - 1] ?? path
    names.push(baseName)
  }
  return names
}

/**
 * Build a map from base name to full zip path (first match wins for duplicates).
 */
function buildPathByBaseName(zip: JSZip): Map<string, string> {
  const map = new Map<string, string>()
  for (const path of Object.keys(zip.files)) {
    if (path.endsWith('/')) continue
    const segs = path.split('/').filter(Boolean)
    const baseName = segs[segs.length - 1] ?? path
    if (!map.has(baseName)) map.set(baseName, path)
  }
  return map
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

/**
 * Process a ZIP using AI: generateMetadata + structureSections, then create
 * course, sections, and assets in Supabase. Returns courseId and shareable link.
 * File-name matching: section fileNames (from LLM) are matched to zip paths by
 * base name; first matching path wins when multiple files share a name.
 */
export async function processZipWithAI(
  zipBlob: Blob,
  onProgress?: (p: ProcessProgress) => void
): Promise<{ courseId: string; shareableLink: string }> {
  const zip = await loadZip(zipBlob)
  const fileNames = getFileNamesFromZip(zip)
  if (fileNames.length === 0) throw new Error('ZIP contains no files')

  const [metadata, structureResult] = await Promise.all([
    generateMetadata(fileNames),
    structureSections(fileNames),
  ])

  const course = await createCourse({
    title: metadata.title,
    description: metadata.description,
    level: null,
  })
  if (!course) throw new Error('Failed to create course')
  const courseId = course.id

  const sections = structureResult.sections ?? []
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

  const pathByBaseName = buildPathByBaseName(zip)
  const allAssets: { sectionIndex: number; fileName: string }[] = []
  sections.forEach((sec, sectionIndex) => {
    const names = sec.fileNames ?? []
    names.forEach((fileName) => allAssets.push({ sectionIndex, fileName }))
  })

  const total = allAssets.length
  for (let start = 0; start < allAssets.length; start += BATCH_SIZE) {
    onProgress?.({ phase: 'assets', current: start, total })
    const batch = allAssets.slice(start, start + BATCH_SIZE)
    for (const { sectionIndex, fileName } of batch) {
      const zipPath = pathByBaseName.get(fileName)
      if (!zipPath) {
        console.warn(`No file in ZIP for name: ${fileName}, skipping`)
        continue
      }
      const blob = await extractFile(zip, zipPath)
      const sectionId = sectionIds[sectionIndex]
      const url = await uploadAssetFile(courseId, sectionId, fileName, blob)
      await createAsset({
        section_id: sectionId,
        name: fileName,
        type: getTypeFromFileName(fileName),
        url,
        content: null,
      })
    }
  }
  onProgress?.({ phase: 'assets', current: total, total })

  const shareableLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/courses/${courseId}`
      : `${courseId}`

  return { courseId, shareableLink }
}
