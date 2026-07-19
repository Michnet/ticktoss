import { s3MediaUrl, s3RenderedAppMediaUrl, s3RenderedMediaUrl } from "./base";

// Normalizes any previously-saved image reference (a bare storage path, an
// object-endpoint public URL, or a render-endpoint URL with size params)
// down to the bare "{userId}/{fileName}" storage path.
export function getStoragePath(url) {
  if (!url || typeof url !== 'string') return null;
  const bases = [s3MediaUrl, s3RenderedMediaUrl, s3RenderedAppMediaUrl];
  const base = bases.find(b => url.includes(b));
  const path = base ? url.slice(url.indexOf(base) + base.length) : url;
  return path.split('?')[0];
}

export function translateSize(size){
  switch (size) {
    case 'thumbnail':
      return 200;
    case 'medium':
      return 300;
    case '400':
      return 400;
    case '500x500':
      return 500;
    case 'big_thumb':
      return 500;
    case 'medium_large':
      return 768;
    case 'large':
      return 1024;
  
    default:
      return 500;
  }
}

export function resizedImage(imgUrl = '', desiredSize, width=true) {
  let sizesArr = ['thumbnail.', 'medium.', 'medium_large.', 'large.', 'big_thumb.', '500x500.'];
  if(imgUrl){
      const oldWp = 'https://wordpress-t4gsk408cksoog8g008o8sgc.afyapals.com';

      if(imgUrl?.includes(oldWp)/*  || imgUrl?.includes(WPDomain) */){
        const newImgUrl = replaceOldWp(imgUrl);
      if (newImgUrl && !sizesArr.some(size => newImgUrl.includes(size))) {
        if(desiredSize && desiredSize !== 'full'){
          switch (true) {
            case newImgUrl.includes('.jpeg'):
              return newImgUrl.replace(".jpeg", `-${desiredSize}.jpeg`);
            case newImgUrl.includes('.webp'):
              return newImgUrl.replace(".webp", `-${desiredSize}.webp`);
            case newImgUrl.includes('.jpg'):
              return newImgUrl.replace(".jpg", `-${desiredSize}.jpg`);
            case newImgUrl.includes('.png'):
              return newImgUrl.replace(".png", `-${desiredSize}.png`);
            case newImgUrl.includes('.gif'):
              return newImgUrl.replace(".gif", `-${desiredSize}.gif`);
          }
        }else{
          return newImgUrl;
        }
      } else {
        return newImgUrl;
      }
    }else{
        const isApp = imgUrl?.includes('product_categories/') || imgUrl?.startsWith('app/');
        const base = isApp ? s3RenderedAppMediaUrl : s3RenderedMediaUrl;
        const fullUrl = imgUrl.includes(base) ? imgUrl : base + imgUrl;

      if(desiredSize == 'full'){
        return fullUrl;
      }
        return `${fullUrl}?${width ? 'width' : 'height'}=${translateSize(desiredSize)}`
    }
  }/* else{
    return '/images/bg/fallback2-md.jpg'
  } */
}


export const randomEither = (array) => {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}