/** Shape of the build-time environment configuration. */
export interface AppEnvironment {
  readonly production: boolean;
  /** Backend base URL — immutable contract (spec.md §3). */
  readonly baseUrl: string;
  /**
   * MapLibre style for the polygon editor (CU-09/CU-10). A style URL (e.g. a
   * MapTiler/OpenFreeMap style) overrides the bundled no-key dark raster style.
   * Leave empty to use the default dark basemap that matches the app theme.
   */
  readonly mapStyleUrl: string;
  /** Groq API key for the CU-15 chat (CU-15). Paste your key here; stays in the build. */
  readonly groqApiKey: string;
  /** Firebase web app configuration — OAuth identity provider (spec.md §4). */
  readonly firebase: {
    readonly apiKey: string;
    readonly authDomain: string;
    readonly projectId: string;
    readonly storageBucket: string;
    readonly messagingSenderId: string;
    readonly appId: string;
  };
}
