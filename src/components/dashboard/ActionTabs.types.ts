export type NavigateMeta = {
  symbol?: string;
  name?: string;
  imageUri?: string;
};

export type DashboardTab =
  | "pulse"
  | "discover"
  | "trackers"
  | "perpetuals"
  | "predictions"
  | "similar"
  | "trade"
  | "instant"
  | "overview"
  | "vision"
  | "rewards"
  | "intel"
  | "tweets"
  | "scan"
  | "swap"
  | "buy"
  | "wallets"
  | "fees"
  | "faqs"
  | "support"
  | "send"
  | "receive";