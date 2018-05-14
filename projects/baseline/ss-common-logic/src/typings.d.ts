
import { Config } from "../../environment";

declare global {
  const ENV: Config & { packageJson: { name: string; } };
}


