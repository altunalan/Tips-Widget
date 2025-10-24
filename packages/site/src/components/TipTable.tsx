import type { TipEntry } from '@megaeth/widget';
import React from 'react';

interface TipTableProps {
  tips: TipEntry[];
}

export const TipTable: React.FC<TipTableProps> = ({ tips }) => {
  if (!tips.length) {
    return <p>No tips yet.</p>;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={cellStyle}>From</th>
          <th style={cellStyle}>Amount (ETH)</th>
          <th style={cellStyle}>Memo</th>
          <th style={cellStyle}>Block</th>
        </tr>
      </thead>
      <tbody>
        {tips.map((tip) => (
          <tr key={`${tip.transactionHash}-${tip.cursor ?? ''}`}>
            <td style={cellStyle}>{tip.from}</td>
            <td style={cellStyle}>{tip.amountEth}</td>
            <td style={cellStyle}>{tip.memo}</td>
            <td style={cellStyle}>{tip.blockNumber}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const cellStyle: React.CSSProperties = {
  borderBottom: '1px solid #e2e8f0',
  padding: '8px',
  textAlign: 'left',
};
