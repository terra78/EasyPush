export const PRODUCTS = [
  {
    name: "一味徒党 vocalist's ring(13号)",
    url: "https://sr-nekokiosk.com/products/202603170028",
    watchMode: "variant_size",
    targetSize: "13"
  },
  {
    name: "一味徒党 guitarist's ring(13号)",
    url: "https://sr-nekokiosk.com/products/202603170033",
    watchMode: "variant_size",
    targetSize: "13"
  },
  {
    name: "一味徒党 nut ear cuff",
    url: "https://sr-nekokiosk.com/products/202603170040",
    watchMode: "product"
  },
  {
    name: "一味徒党 spanner top",
    url: "https://sr-nekokiosk.com/products/202603170041",
    watchMode: "product"
  },
  {
    name: "一味徒党 whistle",
    url: "https://sr-nekokiosk.com/products/202603170044",
    watchMode: "product"
  },
  {
    name: "ボールチェーン",
    url: "https://sr-nekokiosk.com/products/202603170045",
    watchMode: "product"
  }
];

export const WATCH_RULES = {
  unavailableKeyword: "在庫確認中",
  unavailableKeywords: ["在庫確認中", "Checking stock"],
  fallbackAvailableKeywords: [
    "カートに追加",
    "今すぐ購入",
    "Add to cart",
    "Buy it now"
  ],
  fallbackUnavailableKeywords: [
    "売り切れ",
    "SOLD OUT",
    "在庫切れ"
  ],
  consecutiveNonCheckingThreshold: 2
};
