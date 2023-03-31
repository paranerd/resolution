<template>
  <span class="container" @click="pickFile">
    <input
      id="files"
      type="file"
      ref="fileInput"
      accept="image/*,video/*"
      @change="updateQueue($event)"
      multiple
    />
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import itemService from '@/services/item';

export default defineComponent({
  data() {
    return {
      file: null,
      queue: [] as File[],
      current: 0,
      total: 0,
    };
  },
  methods: {
    pickFile() {
      (this.$refs.fileInput as HTMLInputElement).click();
    },
    updateQueue(e: Event) {
      // Add all files to upload queue
      const files = (e.target as HTMLInputElement).files ?? [];
      for (const file of files) {
        this.queue.push(file);
      }

      // Start uploading if not started
      if (this.queue.length === files.length) {
        this.handleFileUpload();
      }
    },
    async handleFileUpload() {
      // Loop over upload queue
      while (this.queue.length) {
        this.current += 1;
        const file = this.queue.shift();

        if (!file) {
          continue;
        }

        const formData = new FormData();
        formData.append('files', file);
        const reader = new FileReader();

        this.$store.commit('updateUploadStatus', {
          filename: file.name,
          current: this.current,
          total: this.current + this.queue.length,
        });

        reader.onload = (event) => {
          const img = new Image();
          img.src = (event.target?.result as string);

          this.$store.commit('updateUploadStatus', {
            thumbnail: `url('${(event.target?.result as string)}')`
          });
        };
        reader.readAsDataURL(file);

        const res = await itemService.upload(formData, (event) => {
            const total = event.total ?? event.loaded;
            const percentage = Math.round((event.loaded / total) * 100);

            this.$store.commit('updateUploadStatus', {
              progress: percentage,
            });
          });

        // Add uploaded items
        if (res.data.items.length) {
          this.$store.commit('addItems', res.data.items);
        }
      }

      // Reset file input
      (this.$refs.fileInput as HTMLInputElement).value = '';
    },
  },
});
</script>

<style lang="scss" scoped>
.container {
  position: absolute;
  width: 100%;
  height: 100%;
}

#files {
  display: none;
}
</style>
