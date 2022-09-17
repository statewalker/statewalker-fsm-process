export default function combineHandlers(...list) {
  return (...args) => list.forEach((f) => f(...args));
}