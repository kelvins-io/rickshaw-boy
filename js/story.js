/**
 * 七个关键节点：抉择 / 拉车小游戏 / 跳转
 * next: string | (state) => string
 * minigame: { difficulty, brief, rounds?, after: (state, results) => nextId }
 */

export const NODES = {
  n1_enter: {
    chapter: "第一站",
    title: "进城拉车",
    body: [
      "乡下的青年扛着铺盖卷进了北平。城门洞里的风带着煤烟和马粪味，祥子把裤脚扎紧，眼睛却亮着。",
      "他想要一辆自己的车。不是租的，是买断的、能响着铃跑过整条街的那种。车厂门外，人和车挤成一团。",
    ],
    choices: [
      {
        text: "去仁和车厂，租一辆较新的车",
        effect: "积蓄 -4 · 体力 +6 · 体面 +4",
        delta: { money: -4, stamina: 6, dignity: 4 },
        next: "n1_pull",
      },
      {
        text: "找便宜的破车厂，多攒几个子儿",
        effect: "积蓄 +6 · 体力 -8 · 体面 -2",
        delta: { money: 6, stamina: -8, dignity: -2 },
        next: "n1_pull",
      },
      {
        text: "先在街边站着看行情，再开口",
        effect: "体面 +6 · 积蓄 -2",
        delta: { money: -2, dignity: 6 },
        next: "n1_pull",
      },
    ],
  },

  n1_pull: {
    chapter: "第一站 · 上路",
    title: "第一次拉活",
    body: [
      "车把沉甸甸的。路面的石子硌着脚，耳边是喇叭与叫卖。客人指了个方向，祥子深吸一口气——",
      "这是他在北平的第一程。跑稳了，才有后面的日子。",
    ],
    minigame: {
      difficulty: 1,
      brief: "按住空格或触屏加速；↑↓ 或滑动变道躲开坑洼与恶犬。",
      rounds: 1,
      after: (state, results) => {
        const earn = results.reduce((s, r) => s + r.earn, 0);
        return {
          delta: { money: earn },
          next: "n2_save",
          toast: `本程收入 +${earn}`,
        };
      },
    },
  },

  n2_save: {
    chapter: "第二站",
    title: "攒钱买车",
    body: [
      "夜里他把铜子儿一个个码齐，藏在枕头底下。买车的数目像一座山，可祥子觉得自己的腿比山更硬。",
      "车厂老板笑着说：着急的人可以先借一笔，利息嘛……另算。雨季要来了，街市忽冷忽热。",
    ],
    choices: [
      {
        text: "咬牙不借，靠腿一根根积",
        effect: "体面 +8 · 体力 -6",
        delta: { dignity: 8, stamina: -6 },
        next: "n2_pull",
      },
      {
        text: "借一笔，先把新车摸到手",
        effect: "积蓄 +22 · 体面 -10 · 标记借贷",
        delta: { money: 22, dignity: -10, flags: { borrowed: true } },
        next: "n2_pull",
      },
      {
        text: "白天拼命拉，夜里少睡",
        effect: "积蓄 +10 · 体力 -14 · 体面 +2",
        delta: { money: 10, stamina: -14, dignity: 2 },
        next: "n2_pull",
      },
    ],
  },

  n2_pull: {
    chapter: "第二站 · 连轴转",
    title: "多跑几程",
    body: [
      "从清晨到掌灯，祥子几乎不歇脚。风里雨里，只要有人招手，车把就抬起来。",
      "每一程都是朝「自己的车」再近一步——也更靠近极限。",
    ],
    minigame: {
      difficulty: 2,
      brief: "连续拉两程。障碍更多，别让体力见底。",
      rounds: 2,
      after: (state, results) => {
        const earn = results.reduce((s, r) => s + r.earn, 0);
        const owned = state.money + earn >= 55;
        return {
          delta: {
            money: earn,
            dignity: owned ? 6 : 0,
            flags: owned ? { ownedRickshaw: true } : {},
          },
          next: "n3_soldiers",
          toast: owned
            ? `攒够了！积蓄 +${earn}。他摸到了属于自己的车把。`
            : `积蓄 +${earn}。车还差一口气，但日子还得过。`,
        };
      },
    },
  },

  n3_soldiers: {
    chapter: "第三站",
    title: "大兵与骆驼",
    body: [
      "城外忽然起了兵。祥子拉着客人抄近路，却撞上一队乱兵。车被扣了，人被裹挟着走。",
      "夜里他摸黑逃出营地，身后跟着三匹受惊的骆驼。城里的灯火远得像别人的梦。",
    ],
    choices: [
      {
        text: "硬拼夺车——车是命根子",
        effect: "体面 +10 · 体力 -20 · 积蓄 -18",
        delta: { dignity: 10, stamina: -20, money: -18, flags: { hasCamel: false, ownedRickshaw: false } },
        next: "n4_huniu",
      },
      {
        text: "忍气求饶，只求留条活路",
        effect: "体面 -16 · 体力 -6 · 积蓄 -8",
        delta: { dignity: -16, stamina: -6, money: -8, flags: { ownedRickshaw: false } },
        next: "n4_huniu",
      },
      {
        text: "弃车逃命，牵走骆驼换几个钱",
        effect: "积蓄 +12 · 体面 -4 · 体力 -10 · 得骆驼钱",
        delta: { money: 12, dignity: -4, stamina: -10, flags: { hasCamel: true, ownedRickshaw: false } },
        next: "n4_huniu",
      },
    ],
  },

  n4_huniu: {
    chapter: "第四站",
    title: "虎妞逼婚",
    body: [
      "回城后，人和车厂的虎妞像一堵墙挡住去路。她知道祥子的软肋：要车、要脸、要一条能站直的路。",
      "酒桌上她把话摊开——跟她过，车的事好商量；不跟她过，这城里也别想好过。",
    ],
    choices: [
      {
        text: "接受婚姻，先把日子稳住",
        effect: "积蓄 +16 · 体面 -14 · 体力 +4",
        delta: { money: 16, dignity: -14, stamina: 4, flags: { marriedHuniu: true } },
        next: "n5_buy",
      },
      {
        text: "拖延敷衍，心里另打主意",
        effect: "体面 -6 · 积蓄 +4",
        delta: { dignity: -6, money: 4 },
        next: "n5_buy",
      },
      {
        text: "拒绝——哪怕再从零开始",
        effect: "体面 +14 · 积蓄 -10 · 体力 -4",
        delta: { dignity: 14, money: -10, stamina: -4, flags: { marriedHuniu: false } },
        next: "n5_buy",
      },
    ],
  },

  n5_buy: {
    chapter: "第五站",
    title: "再买洋车",
    bodyFn: (state) => {
      const lines = [
        "厂子里的新车一排排亮着漆，车价仍是那座山。雨雪天的客人少，可雨雪天的车份一点不少。",
      ];
      if (state.flags.marriedHuniu) {
        lines.push("虎妞替他张罗过几回，钱是有了着落，可街坊的闲话也缠在车轮上。");
      } else if (state.money >= 50) {
        lines.push("枕头底下的铜子儿又聚成了堆。这一回，他还能不能握紧车把？");
      } else {
        lines.push("积蓄还差一截。雨雪里多跑几程，也许能把缺口补上——也许会把身体拖垮。");
      }
      return lines;
    },
    choices: [
      {
        text: "倾尽积蓄，再买一辆属于自己的车",
        effect: "需积蓄 ≥ 50 · 积蓄 -45 · 体面 +10",
        require: (s) => s.money >= 50,
        requireHint: "积蓄不足 50，买不起",
        delta: { money: -45, dignity: 10, flags: { ownedRickshaw: true } },
        next: "n5_pull",
      },
      {
        text: "先租着，雨雪里把本钱挣回来",
        effect: "体面 -4 · 进入雨雪拉车",
        delta: { dignity: -4 },
        next: "n5_pull",
      },
      {
        text: "把钱抠着花，车的事以后再说",
        effect: "积蓄 +6 · 体面 -8 · 体力 +4",
        delta: { money: 6, dignity: -8, stamina: 4 },
        next: "n6_fuzi",
      },
    ],
  },

  n5_pull: {
    chapter: "第五站 · 雨雪",
    title: "雨雪天",
    body: [
      "雪片子打在脸上像细砂。车辙里积着泥浆，恶犬从巷口窜出来。祥子咬着牙，把客人往前送。",
      "这一程，比夏天的烈日更磨人。",
    ],
    minigame: {
      difficulty: 3,
      brief: "雨雪天：路面滑、障碍密。按住加速，看准时机躲闪。",
      rounds: 1,
      after: (state, results) => {
        const earn = results.reduce((s, r) => s + r.earn, 0);
        return {
          delta: { money: earn },
          next: "n6_fuzi",
          toast: `雨雪程收入 +${earn}`,
        };
      },
    },
  },

  n6_fuzi: {
    chapter: "第六站",
    title: "小福子",
    body: [
      "小福子站在屋檐下，头发被风吹乱，眼里却还留着一点不肯灭的光。她求的不是同情，是一口还能喘气的地方。",
      "祥子看着自己的手——拉过车，也空过。这一回，他要不要伸出去？",
    ],
    choices: [
      {
        text: "伸出援手，分一半活路给她",
        effect: "积蓄 -14 · 体面 +16 · 体力 -4",
        delta: { money: -14, dignity: 16, stamina: -4, flags: { helpedFuzi: true } },
        next: "n7_finale",
      },
      {
        text: "自保为先，装作没看见",
        effect: "体面 -18 · 积蓄 +4",
        delta: { dignity: -18, money: 4, flags: { helpedFuzi: false } },
        next: "n7_finale",
      },
      {
        text: "答应攒钱救她，自己再拼一程",
        effect: "体面 +8 · 体力 -10 · 积蓄 -6",
        delta: { dignity: 8, stamina: -10, money: -6, flags: { helpedFuzi: true } },
        next: "n6_pull",
      },
    ],
  },

  n6_pull: {
    chapter: "第六站 · 再拼",
    title: "为她多跑一程",
    body: [
      "他把「救她」三个字咬在嘴里，车把抬得比平时更低。街市的喧闹退成远处的嗡嗡声，只剩脚步和铃铛。",
    ],
    minigame: {
      difficulty: 2,
      brief: "再拼一程。收入将决定承诺能否兑现。",
      rounds: 1,
      after: (state, results) => {
        const earn = results.reduce((s, r) => s + r.earn, 0);
        return {
          delta: { money: earn, dignity: earn >= 10 ? 4 : 0 },
          next: "n7_finale",
          toast: `加跑收入 +${earn}`,
        };
      },
    },
  },

  n7_finale: {
    chapter: "第七站",
    title: "命运终局",
    body: [
      "北平的春天从不按时到来。祥子站在十字路口，前头是车厂、巷子、城门外的土路；后头是他一步步踩出来的脚印。",
      "积蓄、体力、体面——三样东西在风里掂量着彼此。这一回，命运还听不听他的？",
    ],
    choices: [
      {
        text: "直面结局",
        effect: "按当前数值结算",
        delta: {},
        next: "__ENDING__",
      },
    ],
  },
};

export function getNode(id) {
  return NODES[id] || null;
}

export function resolveBody(node, state) {
  if (typeof node.bodyFn === "function") {
    return node.bodyFn(state);
  }
  return (node.body || []).filter((line) => typeof line === "string");
}
