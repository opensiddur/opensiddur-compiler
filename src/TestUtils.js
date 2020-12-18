export function text2xml(txt) {
  return new DOMParser().parseFromString(txt, "application/xml")
}
