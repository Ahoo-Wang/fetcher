import React, { useState } from 'react';
import { useFetcherPagedQuery } from '@ahoo-wang/fetcher-react';
import type { ListQuery, PagedResult, Product } from '@ahoo-wang/fetcher-wow';

// Define the product type based on your API
interface Product {
  id: string;
  name: string;
  price: number;
  // Add other product fields as needed
}

interface ProductListProps {
  pageSize?: number;
}

export function ProductList({ pageSize = 10 }: ProductListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const {
    result,
    loading,
    error,
    execute,
    setPagination,
  } = useFetcherPagedQuery<Product>({
    initialQuery: {
      condition: {},           // Empty condition - get all products
      pagination: {
        index: 1,
        size: pageSize,
      },
      projection: {},          // No field projection
      sort: [],                // No sorting
    },
    execute: async (pagedQuery: ListQuery) => {
      // This would be your actual API call using Fetcher
      const response = await fetch('/api/products/paged', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagedQuery),
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json() as Promise<PagedResult<Product>>;
    },
  });

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setPagination({
      index: newPage,
      size: pageSize,
    });
    execute();
  };

  const { data: products = [], pagination } = result || {};
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.size) : 0;

  if (loading && !result) {
    return <div className="product-list-loading">Loading products...</div>;
  }

  if (error) {
    return (
      <div className="product-list-error">
        Error loading products: {error.message}
        <button onClick={() => execute()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="product-list">
      <h1>Products</h1>

      {loading && <div className="loading-indicator">Updating...</div>}

      <table className="product-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>{product.id}</td>
              <td>{product.name}</td>
              <td>${product.price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
        >
          Previous
        </button>

        <span className="page-info">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default ProductList;
