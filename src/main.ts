/*
 * @Author: 33357
 * @Date: 2021-02-26 16:13:39
 * @LastEditTime: 2021-03-01 17:21:49
 * @LastEditors: 33357
 */
import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import Viewer from 'v-viewer';

Vue.config.productionTip = false;

// 引入ant-desigin
import './ant-desigin';

// 引入moment
import moment from 'moment';
// 使用中文时间
Vue.prototype.$moment = moment;

// 图片预览插件
import 'viewerjs/dist/viewer.css';

Vue.use(Viewer, {
  defaultOptions: {
    navbar: false,
    title: false,
    toolbar: {
      zoomIn: 1,
      zoomOut: 1,
      oneToOne: 4,
      reset: 4,
      prev: 0,
      next: 0,
      rotateLeft: 4,
      rotateRight: 4,
      flipHorizontal: 4,
      flipVertical: 4,
    },
  },
});

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
