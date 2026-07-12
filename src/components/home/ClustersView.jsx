import React from 'react';
import ProductsView from '@/components/home/ProductsView';
import { CLUSTER_VIEWS } from '@/lib/clusterViews';

export default function ClustersView({ groups = [], cardWidth = '320px', cardType = 1, itemExClass = 'flex flex-col' }) {
  if (!groups || groups.length === 0) return null;

  // Filter the clusters based on the keys provided in the groups array
  const activeClusters = CLUSTER_VIEWS.filter(cluster => groups.includes(cluster.id));

  if (activeClusters.length === 0) return null;

  return (
    <>
      {activeClusters.map((cluster) => (
        <section key={cluster.id} className="tt-container tt-container-padding mb-6">
          <ProductsView
            cardWidth={cardWidth}
            cardType={cardType}
            title={cluster.title}
            subTitle={cluster.subTitle}
            description={cluster.description}
            source="custom"
            filters={cluster.filters}
            itemExClass={itemExClass}
          />
        </section>
      ))}
    </>
  );
}
