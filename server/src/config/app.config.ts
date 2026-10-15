/**
 * Loads and exposes app configuration.
 */
class AppConfig {
  public readonly port: number;
  public readonly nodeEnv: string;

  /**
   * Initializes the app config instance.
   */
  constructor() {
    this.port = Number(process.env.PORT) || 5000;
    this.nodeEnv = process.env.NODE_ENV || 'development';
  }
}

export default AppConfig;
