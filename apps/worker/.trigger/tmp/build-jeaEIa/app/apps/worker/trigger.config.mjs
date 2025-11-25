import {
  defineConfig
} from "../../../chunk-SSCMVTO5.mjs";
import {
  init_esm
} from "../../../chunk-SEYBOQLL.mjs";

// trigger.config.ts
init_esm();
var trigger_config_default = defineConfig({
  project: "proj_rpswdrmwsgukkcmrqugp",
  dirs: ["./src/jobs"],
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1e3,
      maxTimeoutInMs: 1e4,
      factor: 2,
      randomize: true
    }
  },
  build: {}
});
var resolveEnvVars = void 0;
export {
  trigger_config_default as default,
  resolveEnvVars
};
//# sourceMappingURL=trigger.config.mjs.map
