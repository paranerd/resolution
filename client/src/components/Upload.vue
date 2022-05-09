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

<script>
import axios from '@/services/axios.js';

export default {
  data() {
    return {
      file: null,
      queue: [],
      current: 0,
      total: 0,
    };
  },
  methods: {
    pickFile() {
      this.$refs.fileInput.click();
    },
    updateQueue(e) {
      // Add all files to upload queue
      for (const file of e.target.files) {
        this.queue.push(file);
      }

      // Start uploading if not started
      if (this.queue.length === e.target.files.length) {
        this.handleFileUpload();
      }
    },
    async handleFileUpload() {
      // Loop over upload queue
      while (this.queue.length) {
        this.current += 1;
        const file = this.queue.shift();

        const formData = new FormData();
        const reader = new FileReader();

        this.$store.commit('updateUploadStatus', {
          filename: file.name,
          current: this.current,
          total: this.current + this.queue.length,
        });

        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;

          this.$store.commit('updateUploadStatus', {
            thumbnail: `url('${event.target.result}')`
          });
        };
        reader.readAsDataURL(file);

        const res = await axios.post('/item/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (event) => {
            const percentage = parseInt(
              Math.round((event.loaded / event.total) * 100)
            );

            this.$store.commit('updateUploadStatus', {
              progress: percentage,
            });
          },
        });

        // Add uploaded items
        if (res.data.items.length) {
          this.$store.commit('addItems', res.data.items);
        }
      }

      // Reset file input
      this.$refs.fileInput.value = null;
    },
  },
};
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
