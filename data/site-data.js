/*
  ふだん書きかえるのは、このファイルだけ。
  - イベントが決まったら event を書く。予定がないときは null にする（「準備中」と表示される）。
  - 日時は「2026-12-10T19:30:00+09:00」の形（日本時間）で書く。
  - 日本語（ja）と英語（en）の両方を書き、内容をそろえる。
*/
window.SITE_DATA = {
  // カレンダーのファイル名などに使う、サイトの名前
  siteName: "GEG KOBE",

  // お問い合わせフォーム（Google フォーム）のアドレス。できるまでは "" のまま
  formUrl: "",

  // 次のイベント。予定がないときは null
  event: null

  /* 書き方の例（使うときは、上の event: null を消して、下を生かす）
  event: {
    start: "2026-12-10T19:30:00+09:00",
    end: "2026-12-10T20:30:00+09:00",
    title: { ja: "第1回 オンラインミーティング", en: "Online meeting #1" },
    theme: { ja: "テーマが入ります", en: "Theme goes here" },
    format: { ja: "オンライン（Google Meet）", en: "Online (Google Meet)" },
    link: "https://meet.google.com/xxx-xxxx-xxx"
  }
  */
};
