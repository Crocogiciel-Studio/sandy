import type { SbxStatus } from '../../../contracts/api';
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
      <h1>sbx est requis</h1>
      <p className="setup-problem" role="status">
        {sbxProblem(status)}
      </p>
      <p>Instructions pour {guide.os}</p>
      <ol>
        {guide.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="setup-actions">
        <button type="button" className="primary" onClick={() => void sbx.openInstallGuide()}>
          Ouvrir les instructions d’installation
        </button>
        <button type="button" onClick={onRecheck} disabled={checking}>
          Revérifier
        </button>
      </div>
    </main>
  );
}
