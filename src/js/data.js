export const KEY_GROUPS = {
  carajas: {
    name: 'Carajás',
    icon: '🏔️',
    keys: [
      { cod: 'FECJ-APD-TEL-REDTI-AB_01-TORRE001', nome: 'TRV11_PA TORRE SUL', local: 'FORA DA MINA' },
      { cod: 'FECJ-APD-TEL-REDTI-AB_03-TORRE003', nome: 'TRV41_PA N4WN1', local: 'FORA DA MINA' },
      { cod: 'FECJ-APD-TEL-REDTI-AB_06-TORRE006', nome: 'TRV91_PA CCO', local: 'FORA DA MINA' },
      { cod: 'FECJ-APD-TEL-REDTI-AB_11-TORRE011', nome: 'TRV31_PA N4E', local: 'FORA DA MINA' },
      { cod: 'FECJ-APD-TEL-REDTI-AB_12-TORRE012', nome: 'TRV51_PA N4WN2', local: 'FORA DA MINA' },
      { cod: 'FECJ-APD-TEL-REDTI-AB_13-TORRE013', nome: 'TRV61_PA N4WSUL', local: 'FORA DA MINA' },
      { cod: 'FECJ-APD-TEL-REDTI-AB_14-TORRE014', nome: 'TRVC1_PA N5SUL', local: 'DENTRO DA MINA' },
      { cod: 'FECJ-APD-TEL-REDTI-AB_15-TORRE015', nome: 'TRVB1_PA N5CCI', local: 'DENTRO DA MINA' },
      { cod: 'FECJ-APD-TEL-REDTI-AB_16-TORRE016', nome: 'CMD', local: 'FORA DA MINA' },
      { cod: 'FECJ-APD-TEL-REDTI-AB_17-TORRE017', nome: 'TRVA1_PA USINA +40', local: 'FORA DA MINA' },
      { cod: 'FECJ-APD-TEL-REDTI-AB_19-TORRE019', nome: 'PERA FEROVIARIA', local: 'FORA DA MINA' },
      { cod: 'FECJ-APD-TEL-REDTI-AB_20-TORRE020', nome: 'TRVN1_PA MORRO 1', local: 'DENTRO DA MINA' },
      { cod: 'FECJ-APD-TEL-REDTI-AB_21-TORRE021', nome: 'TRVZ1_PA GELADO', local: 'FORA DA MINA' },
      { cod: 'FECJ-APD-TEL-REDTI-AB_22-TORRE022', nome: 'SHELTER CAVA 2', local: 'FORA DA MINA' }
    ]
  },
  serra: {
    name: 'Serra Leste',
    icon: '⛰️',
    keys: [
      { cod: 'FECL-APD-TEL-TAP-TORRE001', nome: 'USINA SERRA LESTE', local: 'FORA DA MINA' },
      { cod: 'FECL-APD-TEL-TAP-TORRE002', nome: 'PERA FEROVIARIA', local: 'FORA DA MINA' }
    ]
  },
  postes: {
    name: 'Postes',
    icon: '📡',
    keys: [
      { cod: 'FECJ-APD-TEL-PST-CKS_PST001', nome: 'N4E-EN TRVO1_PA', local: 'DENTRO DA MINA' },
      { cod: 'FECJ-APD-TEL-PST-CKS_PST002', nome: 'N5EN TRVP1_PA', local: 'FORA DA MINA' },
      { cod: 'FECJ-APD-TEL-PST-CKS_PST006', nome: 'PDENW2 TRV81_PA', local: 'DENTRO DA MINA' },
      { cod: 'FECJ-APD-TEL-PST-CKS_PST005', nome: 'CAVA4 TRVS1_PA', local: 'DENTRO DA MINA' }
    ]
  },
  skids: {
    name: 'Skids',
    icon: '🔧',
    keys: [
      { cod: 'FECJ-APD-TEL-SKD-CKS_SKID005', nome: 'COW SUL3 TRV71_PA', local: 'FORA DA MINA' },
      { cod: 'FECJ-APD-TEL-SKD-CKS_SKID011', nome: 'CAVA 3 TRVJ1_PA', local: 'DENTRO DA MINA' },
      { cod: 'FECJ-APD-TEL-SKD-CKS_SKID013', nome: 'CAVA 2 TRVD1_PA', local: 'DENTRO DA MINA' }
    ]
  },
  manganes: {
    name: 'Manganês',
    icon: '🪨',
    keys: [
      { cod: 'MAZU-APD-TEL-STEL-AB_01-TORRE001', nome: 'MANGANES MINA', local: 'DENTRO DA MINA' },
      { cod: 'MAZU-APD-TEL-TAP-TORRE004', nome: 'MANGANES PORTARIA', local: 'FORA DA MINA' }
    ]
  },
  igarape: {
    name: 'Igarapé Baía',
    icon: '💧',
    keys: [
      { cod: 'COAL-INF-FAC-AB-01-TORRE001', nome: 'IGARAPÉ BAIA', local: 'IGARAPÉ BAIA' }
    ]
  }
};

export function getAllKeys() {
  return Object.values(KEY_GROUPS).flatMap(group => group.keys);
}

export function findKeyByCod(cod) {
  return getAllKeys().find(key => key.cod === cod);
}
