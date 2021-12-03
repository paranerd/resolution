<template>
  <span class="container" @click="pickFile">
    <input
      id="files"
      type="file"
      ref="fileInput"
      accept="image/*,video/*"
      @change="handleFileUpload($event)"
      multiple
    />
  </span>
</template>

<script>
import axios from '@/services/axios.js';
import ItemService from '@/services/item';

export default {
  data() {
    return {
      file: null,
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

      await axios.post('/item/upload', formData, {
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

      try {
        await ItemService.getAll(true);
      } catch (err) {
        // Do nothing
      }

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
