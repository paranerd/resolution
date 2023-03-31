<template>
  <google-cast-launcher v-if="castAppId"></google-cast-launcher>
</template>

<script lang="ts">
import TokenService from '@/services/token';
import SystemService from '@/services/system';
import { defineComponent } from 'vue';

export default defineComponent({
  props: ['id'],
  data() {
    return {
      host: process.env.VUE_APP_API_URL.startsWith('http')
        ? ''
        : `${window.location.protocol}//${window.location.host}`,
      castAppId: null,
    };
  },
  watch: {
    id(newVal) {
      this.load(newVal);
    },
  },
  async created() {
    // First get the Cast App ID
    this.castAppId = await SystemService.getCastAppId();

    if (!this.castAppId) {
      return;
    }

    // Next set up the callback function...
    (window as any)['__onGCastApiAvailable'] = (isAvailable: boolean) => {
      if (isAvailable) {
        this.initializeCastApi();
        this.checkSession();
      }
    };

    // Then load the Cast Framework if not loaded
    if (typeof (window as any).cast === 'undefined' || typeof (window as any).chrome === 'undefined') {
      this.loadScript(
        'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1'
      );
    }

    this.load(this.id);
  },
  methods: {
    initializeCastApi() {
      (window as any).cast.framework.CastContext.getInstance().setOptions({
        receiverApplicationId: this.castAppId,
        autoJoinPolicy: (window as any).chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });
    },
    checkSession() {
      const context = (window as any).cast.framework.CastContext.getInstance();
      context.addEventListener(
        (window as any).cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        (event: {sessionState: string}) => {
          switch (event.sessionState) {
            case (window as any).cast.framework.SessionState.SESSION_STARTED:
            case (window as any).cast.framework.SessionState.SESSION_RESUMED:
              this.load(this.id);
              break;
            case (window as any).cast.framework.SessionState.SESSION_ENDED:
              // Update locally as necessary
              break;
          }
        }
      );
    },
    /**
     * Load media.
     *
     * @param {string} id
     */
    async load(id: string) {
      // Check if cast library is loaded
      if (typeof (window as any).cast === 'undefined' || typeof (window as any).chrome === 'undefined') {
        return;
      }

      const castSession =
      (window as any).cast.framework.CastContext.getInstance().getCurrentSession();

      if (!castSession) {
        return;
      }

      const currentMediaURL = `${this.host}${
        process.env.VUE_APP_API_URL
      }/item/${id}?token=${await TokenService.getToken()}`;
      const contentType = 'image/jpeg';
      const mediaInfo = new (window as any).chrome.cast.media.MediaInfo(
        currentMediaURL,
        contentType
      );
      mediaInfo.customData = {
        cutomData: 'inMediaInfo',
      };
      const request = new (window as any).chrome.cast.media.LoadRequest(mediaInfo);
      request.credentials = 'these-are-credentials';
      request.customData = {
        mine: 'worx',
      };

      try {
        await castSession.loadMedia(request);
      } catch (err) {
        console.error('Error loading media', err);
      }
    },
    /**
     * Load script by appending <script> to <body>.
     *
     * @param {string} url
     */
    loadScript(url: string) {
      const script = document.createElement('script');
      script.innerHTML = '';
      script.src = url;
      document.body.appendChild(script);
    },
  },
});
</script>

<style lang="scss">
google-cast-launcher {
  width: 24px;
  height: 24px;
  --connected-color: #ca358d;
  --disconnected-color: #3d3d3d;
}
</style>
