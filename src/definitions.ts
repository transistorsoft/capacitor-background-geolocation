export interface BackgroundGeolocationPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
}
