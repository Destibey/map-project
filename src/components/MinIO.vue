<template>
    <div>
      <el-upload
        action=""
        list-type="picture-card"
        :file-list="fileList"
        :http-request="uploadFile"
        :on-remove="handleRemove"
      >
        <i class="el-icon-plus"></i>
      </el-upload>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    data() {
      return {
        fileList: [] // 存储上传成功的文件信息
      };
    },
    methods: {
      // 自定义上传逻辑
      async uploadFile(fileData) {
        const formData = new FormData();
        formData.append("file", fileData.file);
        try {
          const res = await axios.post("/api/files/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
  
          if (res.data.success) {
            this.fileList.push({
              name: res.data.filename,
              url: res.data.url
            });
          } else {
            this.$message.error("上传失败: " + res.data.message);
          }
        } catch (error) {
          this.$message.error("上传失败");
        }
      },
  
      // 删除图片
      async handleRemove(file) {
        try {
          const filename = file.name;
          const res = await axios.delete(`/api/files/delete?filename=${filename}`);
          if (res.data.success) {
            this.$message.success("删除成功");
          } else {
            this.$message.error("删除失败: " + res.data.message);
          }
        } catch (error) {
          this.$message.error("删除失败");
        }
      }
    }
  };
  </script>
  