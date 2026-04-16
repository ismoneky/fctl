"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      mode: "single",
      // single, all
      currentImage: {
        image: "",
        name: "",
        desc: ""
      },
      currentTitle: "",
      currentDesc: "",
      allImages: [
        {
          image: "https://cdn.hbfctl.com.cn/more/1.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/more/2.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/more/3.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/more/4.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/more/5.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/more/7.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/more/8.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/more/9.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/more/10.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/more/11.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/more/12.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/more/13.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/more/14.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/more/17.jpg"
        },
        {
          image: "https://cdn.hbfctl.com.cn/more/16.jpg"
        }
      ],
      scenicList: [
        {
          id: 2,
          name: "天路盘山道",
          image: "https://cdn.hbfctl.com.cn/index/7.jpg",
          desc: `  当夕阳的金光倾泻而下，将连绵山脊染成一片暖橙，那条蜿蜒盘旋于山间的公路，便成了无数自驾人魂牵梦萦的"天路"。

  站在山巅俯瞰，公路如同大地的笔触，以流畅的弧线勾勒出群山的轮廓。路面光洁，曲折迂回，忽而贴着山腰向远处延伸，忽而消失在起伏的山脊之后，令人心生无限遐想。车行其上，窗外的风景随每一个转弯而焕然一新，那种驾驭山川的自由感，是任何语言都难以描摹的畅快。

  山脊之上，数十座洁白的风力发电机巍然矗立，叶片在晚风中从容旋转。它们高耸入云，与金色的天际线相互映衬，既是现代文明的印记，又成了这片山野中最具视觉冲击力的风景线。一台台风机如同守望者，静静伫立于山巅，见证着每一位驾车而来的旅人。

  天空中，橙红与湛蓝交融，几缕棉絮般的云朵被霞光镀上了玫瑰色，飞机划过的白色轨迹横贯蓝天，为这幅壮阔的画卷增添了一笔动感。远山层叠，色调由近而远渐次深沉，磅礴而辽阔。

  这里，是自驾人的天堂。路在山间，山在云中，人在画里。踩下油门的那一刻，所有的疲惫与束缚都随风而散，剩下的只有前方那条通往远方的天路，以及无边无际的自由。`
        },
        {
          id: 3,
          name: "日落观景点",
          image: "https://cdn.hbfctl.com.cn/index/3.jpg",
          desc: `  暮色将至，站在山巅之上，一幅令人屏息的日落画卷就此徐徐展开。

  天边，一轮圆日正缓缓坠向地平线。夕阳的光芒穿透薄薄的云雾，晕染出一圈耀眼的橙红光晕，宛若一颗燃烧的火球悬于天地之间。天空自下而上，由炽烈的深红渐变为浓郁的橙黄，再过渡到高处淡淡的灰褐，色彩层次丰富而饱满，令人叹为观止。薄雾在远处山谷间轻柔弥漫，将天际线与大地的边界模糊成一片朦胧，更为这场日落增添了几分神秘与悠远。

  山脊的轮廓在逆光中化为一道深沉的剪影，起伏绵延，如同大地沉默的脊梁。几座风力发电机的身影静静伫立于山丘之间，细长的塔身与舒展的叶片在霞光中勾勒出优雅的线条。它们无声地旋转，迎着晚风将这片山野的风能悄然转化为光明与温暖，成为这幅壮美画面中最具时代感的注脚。

  远处隐约可见高压铁塔与工业建筑的轮廓，烟雾袅袅升腾，在落日余晖中显得格外梦幻。天与地、自然与人文，就这样在这一刻奇妙地融合交叠，共同构成了一幅震撼心灵的苍茫图景。

  站在这条风车天路上目送落日，时间仿佛凝固。余晖散尽之前，愿每一个仰望的人，都能在这片橙红天幕下找到内心的宁静与辽阔。`
        },
        {
          id: 4,
          name: "云海平台",
          image: "https://cdn.hbfctl.com.cn/index/8.jpg",
          desc: `  登上风车天路的观景平台，仿佛瞬间踏入了一个超脱尘世的梦幻之境。极目远眺，一场浩瀚的云海奇观正无声地铺陈于天地之间。

  白色的雾气在山谷中汇聚、堆叠，最终化作一片无边无际的洁白汪洋。近处，黛青色的山脊如巨龙般盘踞，坚实深沉的岩层与柔软缥缈的云海形成了强烈的视觉张力。站在这座“平台”之上，人仿佛置身于九天云外，俯瞰着尘世间的静谧与纯洁。

  最令人震撼的，是那些破云而出的风力发电机。在浓厚云层的遮掩下，它们隐去了高大的塔身，只露出修长的叶片和塔尖，宛如一艘艘航行在茫茫白浪中的帆船，又似静默伫立的云端卫士。巨大的叶片在云海上空悠然旋转，为这幅空灵的画卷注入了生动的韵律。而在云雾的间隙，隐约可见输电铁塔的剪影与横跨山间的桥梁轮廓，若隐若现，将现代工程的秩序之美与大自然的磅礴之气奇妙交融。

  风车天路不仅是一条穿梭于群山间的通途，更是一处能让心灵栖息的云端之境。面对此情此景，世间的喧嚣皆被厚重的云层掩埋，留下的唯有震撼、宁静，以及对这方天地无尽的敬畏。`
        },
        {
          id: 1,
          name: "风车观景台",
          image: "https://cdn.hbfctl.com.cn/index/9.jpg",
          desc: `  天边，最后一抹晚霞将地平线烧成炽烈的橙红，那火焰般的色彩向上蔓延，由深橙渐变为玫瑰粉，再过渡到高远处沉静的蓝灰。几缕轻云横卧其间，被余晖点染成柔美的暖色，天空呈现出一种令人心醉的渐变之美。这是白昼与黑夜交接的瞬间，短暂而珍贵，稍纵即逝。

  画面正中，一座巨大的风力发电机以剪影之姿傲然矗立。深黑的塔身直插苍穹，三片叶片舒展开来，在微风中缓缓旋转，与身后绚烂的晚霞天空构成了极具冲击力的构图。这个角度，正是风车天路上公认的最佳观赏点——人与自然的距离在此被无限拉近，巨型风机的磅礴气势在暮光中展露无遗。

  道路从脚下向远方延伸，蜿蜒盘旋于山脊之上，护栏的轮廓在暮色中依稀可辨。一辆白色轿车静静停驻路旁，车主显然早已被眼前的景象深深吸引，不愿错过这转瞬即逝的黄金时刻。远处山脊上，点点灯光开始亮起，人间的烟火气在暮色中悄然浮现。

  在这里停下脚步，让风声与旋转的叶片为你奏响天路之歌，这一刻，值得被永远铭记。`
        }
      ]
    };
  },
  onLoad(options) {
    common_vendor.index.setNavigationBarTitle({
      title: "美景详情"
    });
    common_vendor.index.__f__("log", "at pages/gallery/gallery.vue:138", "单图模式，options.image=", options);
    if (options.mode === "all") {
      this.mode = "all";
      this.showImageList = this.allImages;
    } else {
      this.mode = "single";
      this.currentImage = this.scenicList[options.mode];
    }
  },
  methods: {
    viewImage(item) {
      this.mode = "single";
      this.currentImage = item.image;
      this.currentTitle = item.name;
      this.currentDesc = item.desc;
      common_vendor.index.setNavigationBarTitle({
        title: item.name
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.mode === "single"
  }, $data.mode === "single" ? {
    b: $data.currentImage.image,
    c: common_vendor.t($data.currentImage.desc)
  } : {
    d: common_vendor.f($data.allImages, (item, index, i0) => {
      return {
        a: item.image,
        b: common_vendor.t(item.desc),
        c: index
      };
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/gallery/gallery.js.map
