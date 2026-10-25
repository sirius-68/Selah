import React from 'react';
import { useStore } from '@/lib/store';
import { PACKS, PH_PACK } from '@/lib/content';
import { packDone, packTag } from '@/lib/affirm';
import { Page, go } from '@/ui/overlay';
import { Lead, Title } from '@/ui/kit';
import { PackCard } from '@/features/blocks';

export default function Packs() {
  useStore();
  return (
    <Page title="Packs" back={false}>
      <Title a="Seven days," b="one journey." style={{ marginTop: 6, marginBottom: 12 }} />
      <Lead style={{ marginTop: 0 }}>Each pack has a daily affirmation, a verse and a journal prompt. Day 1 is always free.</Lead>
      {PACKS.map(p => <PackCard key={p.id} p={p} wide tag={packTag(p.id)} done={packDone(p.id)} photo={PH_PACK[p.id]} onPress={() => go('/pack', { id: p.id })} />)}
    </Page>
  );
}
