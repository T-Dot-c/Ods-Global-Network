declare module "fayda-auth" {
  export class FaydaAuth {
    constructor(options: { apiKey: string });
    initiateOTP(fcn: string): Promise<{ transactionId: string }>;
    verifyOTP(transactionId: string, otp: string, fcn: string): Promise<{ user: any }>;
  }
}
