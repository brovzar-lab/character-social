import { NextRequest } from "next/server";
import { spawn } from "child_process";

const STEP_SCRIPTS: Record<string, string> = {
  "process-export": "scripts/process-export.ts",
  "build-key-characters": "scripts/build-key-characters.ts",
  "enrich-characters": "scripts/enrich-characters.ts",
};

const VALID_STEPS = Object.keys(STEP_SCRIPTS);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project, steps, exportPath } = body as {
      project: string;
      steps: string[];
      exportPath?: string;
    };

    if (!project || !steps || steps.length === 0) {
      return Response.json(
        { error: "project and steps are required" },
        { status: 400 }
      );
    }

    const invalid = steps.filter((s) => !VALID_STEPS.includes(s));
    if (invalid.length > 0) {
      return Response.json(
        {
          error: `Invalid steps: ${invalid.join(", ")}. Valid steps: ${VALID_STEPS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        function send(text: string) {
          controller.enqueue(encoder.encode(text + "\n"));
        }

        for (const step of steps) {
          const script = STEP_SCRIPTS[step];
          const args = ["tsx", script];
          if (step === "process-export") {
            args.push(exportPath ?? project);
          }

          send(`\n--- Running: npx ${args.join(" ")} ---\n`);

          await new Promise<void>((resolve) => {
            const child = spawn("npx", args, {
              cwd: process.cwd(),
              env: { ...process.env },
              stdio: ["ignore", "pipe", "pipe"],
            });

            child.stdout.on("data", (chunk: Buffer) => {
              send(chunk.toString());
            });

            child.stderr.on("data", (chunk: Buffer) => {
              send(`[stderr] ${chunk.toString()}`);
            });

            child.on("close", (code) => {
              send(
                `--- Step "${step}" exited with code ${code ?? "unknown"} ---\n`
              );
              resolve();
            });

            child.on("error", (err) => {
              send(`[error] Failed to start "${step}": ${err.message}\n`);
              resolve();
            });
          });
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to run import";
    return Response.json({ error: message }, { status: 500 });
  }
}
