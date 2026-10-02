export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  CircleDetail: { circleId: number; circleName: string };
  CreateCircle: undefined;
  JoinCircle: undefined;
  CreateSession: { circleId: number; circleName: string };
  JastipSession: { sessionId: number; lokasi: string };
  InputPrices: { sessionId: number; lokasi: string };
  SplitBillRecap: { sessionId: number; lokasi: string };
  Settings: undefined;
  EditProfile: undefined;
  PaymentSettings: undefined;
  SecuritySettings: undefined;
  MyCircles: undefined;
  History: undefined;
  ActiveSessions: undefined;
};

