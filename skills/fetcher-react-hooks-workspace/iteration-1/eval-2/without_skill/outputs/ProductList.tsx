import React, { useState, useEffect, useCallback } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface PagedResult<T> {
  data: T[];
  pagination: {
    index: number;
    size: number;
    total: number;
  };
}

interface ProductListProps {
  pageSize?: number;
}

interface ListQuery {
  condition: Record<string, unknown>;
  pagination: {
    index: number;
    size: number;
  };
  projection: Record<string, unknown>;
  sort: Array<Record<string, unknown>>;
}

export function ProductList({ pageSize = 10 }: ProductListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);

    const query: ListQuery = {
      condition: {},
      pagination: {
        index: page,
        size: pageSize,
      },
      projection: {},
      sort: [],
    };

    try {
      const response = await fetch('/api/products/paged', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
      });

      if (!response.ok) throw new Error('Failed to fetch products');

      const result: PagedResult<Product> = await response.json();
      setProducts(result.data);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, fetchProducts]);

  const totalPages = Math.ceil(total / pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading && products.length === 0) {
    return <div className="product-list-loading">Loading products...</div>;
  }

  if (error) {
    return (
      <div className="product-list-error">
        Error loading products: {error.message}
        <button onClick={() => fetchProducts(currentPage)}>Retry</button>
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
