type OcrSdk = Pick<typeof import('tesseract.js'), 'createWorker' | 'OEM' | 'PSM'>;

/** CommonJS dynamic imports are wrapped in `default` by the production bundler. */
export function resolveOcrSdk(module: unknown): OcrSdk {
 const exports=module as {default?:unknown} | null;
 const sdk=(exports?.default ?? exports) as Partial<OcrSdk> | null;
 if(typeof sdk?.createWorker!=='function' || sdk.OEM?.LSTM_ONLY===undefined || sdk.PSM?.AUTO===undefined){
  throw new Error('The photo checker couldn’t start. Refresh the page and try again.');
 }
 return sdk as OcrSdk;
}
