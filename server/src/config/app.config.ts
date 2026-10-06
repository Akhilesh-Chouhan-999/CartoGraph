class AppConfig {
  public readonly port: number;
  public readonly nodeEnv: string;

  constructor() {
    this.port = Number(process.env.PORT) || 5000;
    this.nodeEnv = process.env.NODE_ENV || 'development';
  }
}

export default AppConfig;
