type DocumentationPhoto = {
  url?: unknown
  publicId?: unknown
}

export function getDocumentationPhotoFields(photos: unknown) {
  const photoItems: DocumentationPhoto[] = Array.isArray(photos)
    ? photos
    : typeof photos === 'string'
      ? [{ url: photos }]
      : []

  return {
    photoUrl: photoItems
      .map((photo) => (typeof photo.url === 'string' ? photo.url.trim() : ''))
      .filter(Boolean)
      .join(','),
    publicId: photoItems
      .map((photo) => (typeof photo.publicId === 'string' ? photo.publicId.trim() : ''))
      .filter(Boolean)
      .join(','),
  }
}

export function serializeDocumentation<T extends { photos: unknown }>(doc: T) {
  return {
    ...doc,
    ...getDocumentationPhotoFields(doc.photos),
  }
}
