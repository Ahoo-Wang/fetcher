import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Card,
  Typography,
  Space,
  Button,
  Input,
  Row,
  Col,
  Tag,
  Alert,
  Select,
} from 'antd';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const meta: Meta = {
  title: 'Viewer/Filter System',
  parameters: {
    docs: {
      description: {
        component:
          'Advanced filtering and data visualization utilities for API responses.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const ViewerDemo: React.FC = () => {
  const [data, setData] = useState([
    { id: 1, name: 'John Doe', age: 30, city: 'New York', active: true },
    { id: 2, name: 'Jane Smith', age: 25, city: 'Los Angeles', active: false },
    { id: 3, name: 'Bob Johnson', age: 35, city: 'Chicago', active: true },
    { id: 4, name: 'Alice Brown', age: 28, city: 'Houston', active: true },
  ]);

  const [filteredData, setFilteredData] = useState(data);
  const [filterType, setFilterType] = useState('name');
  const [filterValue, setFilterValue] = useState('');
  const [filterOperator, setFilterOperator] = useState('contains');

  const applyFilter = () => {
    if (!filterValue) {
      setFilteredData(data);
      return;
    }

    const result = data.filter(item => {
      const value = item[filterType as keyof typeof item];
      const stringValue = String(value).toLowerCase();
      const filterString = filterValue.toLowerCase();

      switch (filterOperator) {
        case 'equals':
          return stringValue === filterString;
        case 'contains':
          return stringValue.includes(filterString);
        case 'startsWith':
          return stringValue.startsWith(filterString);
        case 'endsWith':
          return stringValue.endsWith(filterString);
        case 'greaterThan':
          return Number(value) > Number(filterValue);
        case 'lessThan':
          return Number(value) < Number(filterValue);
        default:
          return true;
      }
    });
    setFilteredData(result);
  };

  const clearFilter = () => {
    setFilterValue('');
    setFilteredData(data);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={3}>🔍 Data Filtering & Viewer</Title>
        <Paragraph>
          Interactive demonstration of the advanced filtering system for
          processing and visualizing API response data with complex query
          conditions.
        </Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Filter Configuration" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Field:</Text>
                <Select
                  value={filterType}
                  onChange={setFilterType}
                  style={{ width: '100%', marginTop: 4 }}
                >
                  <Option value="name">Name</Option>
                  <Option value="age">Age</Option>
                  <Option value="city">City</Option>
                  <Option value="active">Active</Option>
                </Select>
              </div>

              <div>
                <Text strong>Operator:</Text>
                <Select
                  value={filterOperator}
                  onChange={setFilterOperator}
                  style={{ width: '100%', marginTop: 4 }}
                >
                  <Option value="equals">Equals</Option>
                  <Option value="contains">Contains</Option>
                  <Option value="startsWith">Starts With</Option>
                  <Option value="endsWith">Ends With</Option>
                  <Option value="greaterThan">Greater Than</Option>
                  <Option value="lessThan">Less Than</Option>
                </Select>
              </div>

              <div>
                <Text strong>Value:</Text>
                <Input
                  value={filterValue}
                  onChange={e => setFilterValue(e.target.value)}
                  placeholder="Enter filter value"
                  style={{ marginTop: 4 }}
                />
              </div>

              <Space>
                <Button type="primary" onClick={applyFilter}>
                  Apply Filter
                </Button>
                <Button onClick={clearFilter}>Clear</Button>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card title="Filtered Results" size="small">
            <div style={{ marginBottom: 16 }}>
              <Text>
                Showing {filteredData.length} of {data.length} records
              </Text>
            </div>

            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {filteredData.map(item => (
                <Card
                  key={item.id}
                  size="small"
                  style={{ marginBottom: 8 }}
                  bodyStyle={{ padding: '12px' }}
                >
                  <Row gutter={16}>
                    <Col span={6}>
                      <Text strong>ID:</Text> {item.id}
                    </Col>
                    <Col span={6}>
                      <Text strong>Name:</Text> {item.name}
                    </Col>
                    <Col span={4}>
                      <Text strong>Age:</Text> {item.age}
                    </Col>
                    <Col span={6}>
                      <Text strong>City:</Text> {item.city}
                    </Col>
                    <Col span={2}>
                      <Tag color={item.active ? 'green' : 'red'}>
                        {item.active ? 'Active' : 'Inactive'}
                      </Tag>
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Sample Data" size="small">
        <div style={{ maxHeight: '200px', overflow: 'auto' }}>
          <pre
            style={{
              background: '#f6f8fa',
              border: '1px solid #d1d9e0',
              borderRadius: '6px',
              padding: '16px',
              fontSize: '12px',
              margin: 0,
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </Card>

      <Card>
        <Title level={4}>Key Features</Title>
        <Space direction="vertical">
          <div>
            <Tag color="blue">Condition Filters</Tag>
            <Text>
              {' '}
              Flexible filtering with multiple operators and data types
            </Text>
          </div>
          <div>
            <Tag color="green">Type Safety</Tag>
            <Text>
              {' '}
              Strongly typed filtering operations with TypeScript support
            </Text>
          </div>
          <div>
            <Tag color="orange">Composable</Tag>
            <Text> Chain multiple filters for complex query conditions</Text>
          </div>
          <div>
            <Tag color="purple">Performance</Tag>
            <Text> Efficient filtering algorithms for large datasets</Text>
          </div>
        </Space>
      </Card>

      <Alert
        message="Advanced Filtering"
        description="The ConditionFilter system supports complex boolean logic, nested conditions, and custom filter operators for building sophisticated data exploration interfaces."
        type="info"
        showIcon
      />
    </Space>
  );
};

export const Default: Story = {
  render: () => <ViewerDemo />,
};
