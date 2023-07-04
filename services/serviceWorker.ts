export default function serviceWorker(): void {
  let self = `${process.env.PUBLIC_URL}/sw.js`;
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register
        .apply(navigator.serviceWorker, [self])
        .then((reg) => console.log('service worker registered', reg.scope))
        .catch((err) => console.log('service worker not registered', err));
    });
  } else {
    console.log('service worker not supported');
  }
}
