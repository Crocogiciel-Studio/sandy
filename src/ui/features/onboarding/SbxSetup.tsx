import type { SbxStatus } from '../../../contracts/api';
import { CodeBlock } from './CodeBlock';
import { installGuide } from './install-guide';
import { sbxProblem } from './sbx-message';

interface SbxSetupProps {
  status: SbxStatus;
  checking: boolean;
  onRecheck: () => void;
}

export function SbxSetup({ status, checking, onRecheck }: SbxSetupProps) {
  const { sbx } = window.sandy;
  const guide = installGuide(sbx.platform);

  return (
    <main className="setup">
      <h1>sbx is required</h1>
      <p className="setup-problem" role="status">
        {sbxProblem(status)}
      </p>
      <p>Instructions for {guide.os}</p>
      <ol>
        {guide.steps.map((step) => (
          <li key={step.text}>
            {step.text}
            {step.command && <CodeBlock code={step.command} />}
          </li>
        ))}
      </ol>
      <div className="setup-actions">
        <button type="button" className="primary" onClick={() => void sbx.openInstallGuide()}>
          Open the install instructions
        </button>
        <button type="button" onClick={onRecheck} disabled={checking}>
          Check again
        </button>
      </div>
    </main>
  );
}
