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
      uploading: false,
      current: 0,
      total: 0,
    };
  },
  methods: {
    pickFile() {
      this.$refs.fileInput.click();
    },
    async handleFileUpload(e) {
      const formData = new FormData();
      for (const file of e.target.files) {
        formData.append('files', file);
      }

      const res = await axios.post('/item/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event) => {
          const percentage = parseInt(
            Math.round((event.loaded / event.total) * 100)
          );
          console.log(percentage);
        },
      });

      // Reset file input
      this.$refs.fileInput.value = null;

      // Add uploaded items
      if (res.data.items.length) {
        this.$store.commit('addItems', res.data.items);
      }
    },
    updateQueue(e) {
      for (const file of e.target.files) {
        this.queue.push(file);
      }

      if (!this.uploading) {
        this.handleFileUploadNew();
      }
    },
    async handleFileUploadNew() {
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

        await this.delay(1);

        // Add uploaded items
        if (res.data.items.length) {
          this.$store.commit('addItems', res.data.items);
        }
      }

      // Reset file input
      this.$refs.fileInput.value = null;
    },
    async handleFileUploadSingle(e) {
      for (let i = 0; i < e.target.files.length; i += 1) {
        const file = e.target.files[i];

        const formData = new FormData();
        formData.append('files', file);
        const reader = new FileReader();

        this.$store.commit('updateUploadStatus', {
          filename: file.name,
          current: i + 1,
          total: e.target.files.length,
        });

        reader.onload = (event) => {
          var img = new Image();
          img.src = event.target.result;

          this.$store.commit('updateUploadThumbnail', `url('${event.target.result}')`);
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
            console.log(percentage);

            this.$store.commit('updateUploadStatus', {
              progress: percentage,
            });
          },
        });

        await this.delay(1);

        // Add uploaded items
        if (res.data.items.length) {
          this.$store.commit('addItems', res.data.items);
        }
      }

      console.log('resetting fileInput');
      // Reset file input
      this.$refs.fileInput.value = null;
    },
    delay(time) {
      return new Promise(resolve => setTimeout(resolve, time));
    }
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
