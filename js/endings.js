/**
 * 四结局判定：沉沦 / 有车无光 / 守住体面 / 双全
 */

export function resolveEnding(state) {
  const { money, stamina, dignity, flags } = state;
  const hasCar = !!flags.ownedRickshaw || money >= 48;
  const highDignity = dignity >= 55;
  const highStamina = stamina >= 35;
  const highMoney = money >= 40;
  const helped = !!flags.helpedFuzi;

  // 沉沦：体面崩坏
  if (dignity < 28 || (dignity < 40 && stamina < 20)) {
    return {
      id: "fall",
      label: "结局 · 沉沦",
      title: "像一块石头沉下去",
      paragraphs: [
        "体面先裂开一道缝，接着是力气，接着是对明天的指望。祥子不再盼自己的车，也不再盼谁的好脸色。",
        "街市还在，铃铛还在，可拉车的人换成了一具会走路的空壳。风从城门洞灌进来，把他仅剩的热气也带走了。",
        flags.marriedHuniu
          ? "虎妞留下的日子像一笔糊涂账，账上没有他的名字，只有「还能撑一天」几个字。"
          : "没有人再问他要不要自己的车。问了，他也只会笑一笑，那笑里什么都没有。",
      ],
    };
  }

  // 双全：三项达标
  if (highDignity && highStamina && highMoney) {
    return {
      id: "both",
      label: "结局 · 双全",
      title: "命运被拉回来了",
      paragraphs: [
        "铜子儿够数，腿还站得住，脊梁也还直着。祥子把车擦得锃亮，铃一响，整条胡同都听得见。",
        helped
          ? "小福子在门口等他收工。两个人的晚饭不丰盛，可灯是暖的，话是人话。"
          : "他没有许下太多愿，只许自己：车是自己的，路也是自己的。",
        "北平仍旧冷、仍旧吵。可这一回，是他握着车把，而不是命运握着他的脖子。",
      ],
    };
  }

  // 有车无光：有车/有钱但体面崩
  if ((hasCar || highMoney) && dignity < 48) {
    return {
      id: "hollow",
      label: "结局 · 有车无光",
      title: "车是新的，人是空的",
      paragraphs: [
        "他终于又摸到了车把，漆面反着光，旁人羡慕他「混出来了」。",
        "只有他自己知道：羡幕停在车轮上，进不了心里。晚上躺下，耳边全是讨好、忍让、以及那些说不出口的委屈。",
        flags.borrowed
          ? "债像影子跟着车跑。车越亮，影子越长。"
          : "他有车，却丢了敢在太阳底下抬头的那种硬气。",
      ],
    };
  }

  // 守住体面：体面与体力过关
  if (highDignity && highStamina) {
    return {
      id: "dignity",
      label: "结局 · 守住体面",
      title: "穷，可是还是个人",
      paragraphs: [
        "积蓄不算多，车也许还是租的。可祥子走路不躲人的眼睛，说话也不先矮半截。",
        helped
          ? "他帮过小福子。这件事不写在账本上，却写在他觉得自己还能算个人的地方。"
          : "他拒绝了一些好做却脏的捷径。夜里肚子会叫，心却比较安静。",
        "改写命运不一定要大富大贵——有时候，是别让自己变成自己最看不起的那种人。",
      ],
    };
  }

  // 兜底：偏沉沦边缘的苟活
  return {
    id: "fall",
    label: "结局 · 沉沦",
    title: "差一口气",
    paragraphs: [
      "差一点就站住，差一点就挺直。北平不等人，风雪也不等人。",
      "祥子把车厂的门看了一眼，最终还是走进了更暗的巷子。故事没有锣鼓收场，只有脚步声渐渐小了。",
      "你感到了那口气——下一次，或许能把它留下。",
    ],
  };
}

export function formatEndingStats(state) {
  return [
    `积蓄 ${state.money}`,
    `体力 ${state.stamina}`,
    `体面 ${state.dignity}`,
    state.flags.ownedRickshaw ? "有自己的车" : "未购车",
    state.flags.helpedFuzi ? "伸过援手" : "未曾援手",
  ];
}
