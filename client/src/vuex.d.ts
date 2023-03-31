// vuex.d.ts
import { Store } from 'vuex';

declare module '@vue/runtime-core' {
  interface State {
    selected: string[];
    items: Item[];
    castAppId: string;
    sortBy: string;
    sortOrder: number;
    upload: UploadStatus;
  }

  interface ComponentCustomProperties {
    $store: Store<State>;
  }
}
