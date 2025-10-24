import { MegaEthTipsElement } from './components/megaeth-tips.js';
export { fetchRecentTips } from './api/logs.js';
export type { FetchRecentTipsOptions, FetchRecentTipsResult, TipEntry } from './api/logs.js';

const TAG_NAME = 'megaeth-tips';

if (!customElements.get(TAG_NAME)) {
  customElements.define(TAG_NAME, MegaEthTipsElement);
}

export default MegaEthTipsElement;
