import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';

function runPythonAgent(input: any): Promise<{ stdout: string; stderr: string; code: number | null }>
{
  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), 'agents', 'analysis_agent.py');

    const child = spawn('python', [scriptPath], {
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, code });
    });

    child.stdin.write(JSON.stringify(input));
    child.stdin.end();
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const transcript: string = (body.transcript || '').trim();
    const language: string | undefined = body.language;

    if (!transcript) {
      return NextResponse.json({ error: "Missing 'transcript'" }, { status: 400 });
    }

    const { stdout, stderr, code } = await runPythonAgent({ transcript, language });

    if (stderr) {
      console.error('[AG2 stderr]', stderr);
    }

    let payload: any;
    try {
      payload = JSON.parse(stdout || '{}');
    } catch {
      payload = { raw: stdout };
    }

    if (code !== 0 && !payload) {
      return NextResponse.json({ error: 'Agent failed', details: stderr }, { status: 500 });
    }

    return NextResponse.json({ success: true, analysis: payload });
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const baseDir = path.join(process.cwd(), 'data', 'analyses');
    const latestPath = path.join(baseDir, 'latest.json');
    const latest = fs.existsSync(latestPath) ? JSON.parse(fs.readFileSync(latestPath, 'utf8')) : null;
    let record: any = null;
    if (latest?.callSid) {
      const recPath = path.join(baseDir, `${latest.callSid}.json`);
      if (fs.existsSync(recPath)) {
        record = JSON.parse(fs.readFileSync(recPath, 'utf8'));
      }
    }
    return NextResponse.json({ latest, record });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to read analyses', details: err?.message || String(err) }, { status: 500 });
  }
}



