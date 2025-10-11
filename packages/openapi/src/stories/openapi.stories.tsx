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
  Table,
} from 'antd';
import { OpenAPI } from '../openAPI';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const meta: Meta = {
  title: 'OpenAPI/Specification Parser',
  parameters: {
    docs: {
      description: {
        component: 'OpenAPI specification parsing and validation utilities.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const OpenApiDemo: React.FC = () => {
  const [specText, setSpecText] = useState(`{
  "openapi": "3.0.0",
  "info": {
    "title": "Sample API",
    "version": "1.0.0",
    "description": "A sample API for demonstration"
  },
  "servers": [
    {
      "url": "https://api.example.com/v1",
      "description": "Production server"
    }
  ],
  "paths": {
    "/users": {
      "get": {
        "summary": "Get all users",
        "operationId": "getUsers",
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/User"
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create a user",
        "operationId": "createUser",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateUserRequest"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "User created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/User"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "id": { "type": "integer" },
          "name": { "type": "string" },
          "email": { "type": "string" },
          "createdAt": { "type": "string", "format": "date-time" }
        }
      },
      "CreateUserRequest": {
        "type": "object",
        "required": ["name", "email"],
        "properties": {
          "name": { "type": "string" },
          "email": { "type": "string", "format": "email" }
        }
      }
    }
  }
}`);
  const [parsedSpec, setParsedSpec] = useState<OpenAPI | null>(null);
  const [error, setError] = useState<string>('');

  const handleParse = () => {
    try {
      const spec: OpenAPI = JSON.parse(specText);
      setParsedSpec(spec);
      setError('');
    } catch (err) {
      setError((err as Error).message);
      setParsedSpec(null);
    }
  };

  const getPathsData = () => {
    if (!parsedSpec) return [];

    return Object.entries(parsedSpec.paths || {}).map(([path, methods]) => ({
      path,
      methods: Object.keys(methods).join(', ').toUpperCase(),
      operations: Object.values(methods)
        .map(op => op.operationId || 'N/A')
        .join(', '),
    }));
  };

  const getSchemasData = () => {
    if (!parsedSpec?.components?.schemas) return [];

    return Object.entries(parsedSpec.components.schemas).map(
      ([name, schema]) => ({
        name,
        type: (schema as any).type || 'object',
        properties: Object.keys((schema as any).properties || {}).join(', '),
      }),
    );
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={3}>📋 OpenAPI Specification Parser</Title>
        <Paragraph>
          Interactive demonstration of OpenAPI specification parsing,
          validation, and exploration capabilities for building robust API
          integrations.
        </Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="OpenAPI Specification" size="small">
            <TextArea
              rows={20}
              value={specText}
              onChange={e => setSpecText(e.target.value)}
              placeholder="Paste your OpenAPI JSON specification here..."
            />
            <Button
              type="primary"
              onClick={handleParse}
              style={{ marginTop: 8 }}
              block
            >
              Parse Specification
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {error && (
              <Alert
                message="Parse Error"
                description={error}
                type="error"
                showIcon
              />
            )}

            {parsedSpec && (
              <Card title="Specification Info" size="small">
                <Space direction="vertical">
                  <div>
                    <Text strong>Title:</Text> {parsedSpec.info.title}
                  </div>
                  <div>
                    <Text strong>Version:</Text> {parsedSpec.info.version}
                  </div>
                  <div>
                    <Text strong>OpenAPI:</Text> {parsedSpec.openapi}
                  </div>
                  <div>
                    <Text strong>Servers:</Text>{' '}
                    {parsedSpec.servers?.length || 0}
                  </div>
                  <div>
                    <Text strong>Paths:</Text>{' '}
                    {Object.keys(parsedSpec.paths || {}).length}
                  </div>
                  <div>
                    <Text strong>Schemas:</Text>{' '}
                    {Object.keys(parsedSpec.components?.schemas || {}).length}
                  </div>
                </Space>
              </Card>
            )}
          </Space>
        </Col>
      </Row>

      {parsedSpec && (
        <>
          <Card title="API Paths" size="small">
            <Table
              dataSource={getPathsData()}
              columns={[
                { title: 'Path', dataIndex: 'path', key: 'path' },
                { title: 'Methods', dataIndex: 'methods', key: 'methods' },
                {
                  title: 'Operations',
                  dataIndex: 'operations',
                  key: 'operations',
                },
              ]}
              size="small"
              pagination={false}
            />
          </Card>

          <Card title="Data Schemas" size="small">
            <Table
              dataSource={getSchemasData()}
              columns={[
                { title: 'Schema Name', dataIndex: 'name', key: 'name' },
                { title: 'Type', dataIndex: 'type', key: 'type' },
                {
                  title: 'Properties',
                  dataIndex: 'properties',
                  key: 'properties',
                },
              ]}
              size="small"
              pagination={false}
            />
          </Card>
        </>
      )}

      <Card>
        <Title level={4}>Key Features</Title>
        <Space direction="vertical">
          <div>
            <Tag color="blue">OpenAPI 3.0 Support</Tag>
            <Text> Full support for OpenAPI 3.0 specification parsing</Text>
          </div>
          <div>
            <Tag color="green">Type Safety</Tag>
            <Text> Strongly typed interfaces for all OpenAPI constructs</Text>
          </div>
          <div>
            <Tag color="orange">Validation</Tag>
            <Text> Built-in validation and error reporting</Text>
          </div>
          <div>
            <Tag color="purple">Extensible</Tag>
            <Text>
              {' '}
              Support for custom extensions and vendor-specific fields
            </Text>
          </div>
        </Space>
      </Card>

      <Alert
        message="Usage in Code Generation"
        description="This OpenAPI parser is used by the @ahoo-wang/fetcher-generator package to automatically generate TypeScript clients and models from API specifications."
        type="info"
        showIcon
      />
    </Space>
  );
};

export const Default: Story = {
  render: () => <OpenApiDemo />,
};
