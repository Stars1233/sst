import { all, ComponentResourceOptions } from "@pulumi/pulumi";
import { Semaphore } from "../../../util/semaphore";
import { local } from "@pulumi/command";

const limiter = new Semaphore(
  parseInt(process.env.SST_BUILD_CONCURRENCY_SITE || "1"),
);

export function siteBuilder(
  name: string,
  args: local.CommandArgs,
  opts?: ComponentResourceOptions,
) {
  // Wait for the all args values to be resolved before acquiring the semaphore
  return all([args]).apply(async ([args]) => {
    await limiter.acquire(name);
    const command = new local.Command(name, args, opts);
    return command.urn.apply(() => {
      limiter.release();
      return command;
    });
  });
}
