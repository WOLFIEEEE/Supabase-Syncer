'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Flex, Spinner, useDisclosure, useToast } from '@chakra-ui/react';
import React from 'react';
import { logger } from '@/lib/services/logger';
import { csrfFetch, initializeCSRF } from '@/lib/utils/csrf-client';
import ConnectionsHeader from '@/components/connections/ConnectionsHeader';
import ConnectionsList from '@/components/connections/ConnectionsList';
import CreateConnectionModal from '@/components/connections/CreateConnectionModal';
import DeleteConnectionDialog from '@/components/connections/DeleteConnectionDialog';
import SchemaInspectorModal from '@/components/connections/SchemaInspectorModal';
import type { Connection, NewConnectionForm, SchemaData } from '@/components/connections/types';

interface KeepAliveStatus {
  keepAlive: boolean;
  lastPingedAt: string | null;
}

const defaultNewConnection: NewConnectionForm = {
  name: '',
  databaseUrl: '',
  environment: 'development',
};

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newConnection, setNewConnection] = useState<NewConnectionForm>(defaultNewConnection);

  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [schemaData, setSchemaData] = useState<SchemaData | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null);

  const [keepAliveStatus, setKeepAliveStatus] = useState<KeepAliveStatus | null>(null);
  const [isTogglingKeepAlive, setIsTogglingKeepAlive] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isSchemaOpen,
    onOpen: onSchemaOpen,
    onClose: onSchemaClose,
  } = useDisclosure();

  const cancelRef = React.useRef<HTMLButtonElement>(null!);

  const router = useRouter();
  const toast = useToast();

  const fetchConnections = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/connections');
      const data = await response.json();
      if (data.success) {
        setConnections(data.data);
      }
    } catch (error) {
      logger.error('Failed to load connections', { error });
      toast({
        title: 'Failed to load connections',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchSchema = async (connectionId: string) => {
    setIsLoadingSchema(true);
    setSchemaData(null);
    try {
      const response = await fetch(`/api/connections/${connectionId}/schema`);
      const data = await response.json();
      if (data.success) {
        setSchemaData(data.data);
        if (data.data.tables.length > 0) {
          setSelectedTable(data.data.tables[0].name);
        }
      } else {
        toast({
          title: 'Failed to load schema',
          description: data.error,
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      logger.error('Failed to load schema', { error });
      toast({
        title: 'Failed to load schema',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoadingSchema(false);
    }
  };

  const fetchKeepAliveStatus = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}/keep-alive`);
      const data = await response.json();
      if (!data.error) {
        setKeepAliveStatus(data);
      }
    } catch (error) {
      logger.error('Failed to fetch keep-alive status', { error });
    }
  };

  useEffect(() => {
    fetchConnections();
    initializeCSRF();
  }, [fetchConnections]);

  const handleInspectConnection = (connection: Connection) => {
    setSelectedConnection(connection);
    setSelectedTable(null);
    setKeepAliveStatus(null);
    onSchemaOpen();
    fetchSchema(connection.id);
    fetchKeepAliveStatus(connection.id);
  };

  const handleToggleKeepAlive = async () => {
    if (!selectedConnection || !keepAliveStatus) return;

    setIsTogglingKeepAlive(true);
    try {
      const response = await csrfFetch(`/api/connections/${selectedConnection.id}/keep-alive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepAlive: !keepAliveStatus.keepAlive }),
      });
      const data = await response.json();

      if (data.success) {
        setKeepAliveStatus({
          ...keepAliveStatus,
          keepAlive: data.keepAlive,
        });
        toast({
          title: data.keepAlive ? 'Keep-Alive Enabled' : 'Keep-Alive Disabled',
          description: data.message,
          status: 'success',
          duration: 3000,
        });
      } else {
        toast({
          title: 'Failed to update',
          description: data.error,
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      logger.error('Failed to update keep-alive setting', { error });
      toast({
        title: 'Failed to update keep-alive setting',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsTogglingKeepAlive(false);
    }
  };

  const handleManualPing = async () => {
    if (!selectedConnection) return;

    setIsPinging(true);
    try {
      const response = await csrfFetch(`/api/connections/${selectedConnection.id}/keep-alive`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        if (keepAliveStatus) {
          setKeepAliveStatus({
            ...keepAliveStatus,
            lastPingedAt: new Date().toISOString(),
          });
        }
        toast({
          title: 'Ping Successful',
          description: data.message,
          status: 'success',
          duration: 3000,
        });
      } else {
        toast({
          title: 'Ping Failed',
          description: data.error || data.message,
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      logger.error('Failed to ping database', { error });
      toast({
        title: 'Failed to ping database',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsPinging(false);
    }
  };

  const formatLastPinged = (lastPingedAt: string | null): string => {
    if (!lastPingedAt) return 'Never';

    const date = new Date(lastPingedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleTestConnection = async (connection: Connection) => {
    setTestingConnectionId(connection.id);
    try {
      const response = await csrfFetch(`/api/connections/${connection.id}/test`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success && data.data.status === 'connected') {
        toast({
          title: 'Connection Successful',
          description: `PostgreSQL ${data.data.version?.split(' ')[1] || ''} • ${data.data.tableCount} tables • ${data.data.responseTime}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: data.data?.error || data.error || 'Unknown error',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      logger.error('Connection test failed', { error });
      toast({
        title: 'Connection Test Failed',
        description: 'Could not reach the server',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setTestingConnectionId(null);
    }
  };

  const handleCreate = async () => {
    if (!newConnection.name || !newConnection.databaseUrl) {
      toast({
        title: 'Please fill in all fields',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await csrfFetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConnection),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Connection created',
          description: `Found ${data.data.syncableTables?.length || 0} syncable tables`,
          status: 'success',
          duration: 3000,
        });
        setNewConnection(defaultNewConnection);
        onClose();
        fetchConnections();
      } else {
        toast({
          title: 'Failed to create connection',
          description: data.error,
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      logger.error('Failed to create connection', { error });
      toast({
        title: 'Failed to create connection',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await csrfFetch(`/api/connections/${deleteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Connection deleted',
          status: 'success',
          duration: 3000,
        });
        fetchConnections();
      } else {
        toast({
          title: 'Failed to delete connection',
          description: data.error,
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      logger.error('Failed to delete connection', { error });
      toast({
        title: 'Failed to delete connection',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setDeleteId(null);
      onDeleteClose();
    }
  };

  return (
    <Box minH="100vh" className="gradient-mesh">
      <ConnectionsHeader onBack={() => router.push('/')} onAddConnection={onOpen} />

      <Container maxW="7xl" py={{ base: 4, md: 8 }} px={{ base: 4, md: 6 }}>
        {isLoading ? (
          <Flex justify="center" py={16}>
            <Spinner size="xl" color="accent.primary" />
          </Flex>
        ) : (
          <ConnectionsList
            connections={connections}
            testingConnectionId={testingConnectionId}
            onInspect={handleInspectConnection}
            onTest={handleTestConnection}
            onDelete={(connectionId) => {
              setDeleteId(connectionId);
              onDeleteOpen();
            }}
            onAddConnection={onOpen}
          />
        )}
      </Container>

      <SchemaInspectorModal
        isOpen={isSchemaOpen}
        onClose={onSchemaClose}
        selectedConnection={selectedConnection}
        schemaData={schemaData}
        isLoadingSchema={isLoadingSchema}
        selectedTable={selectedTable}
        keepAliveStatus={keepAliveStatus}
        isTogglingKeepAlive={isTogglingKeepAlive}
        isPinging={isPinging}
        onSelectTable={setSelectedTable}
        onToggleKeepAlive={handleToggleKeepAlive}
        onManualPing={handleManualPing}
        onRefreshSchema={() => {
          if (selectedConnection) {
            fetchSchema(selectedConnection.id);
          }
        }}
        formatLastPinged={formatLastPinged}
      />

      <CreateConnectionModal
        isOpen={isOpen}
        isCreating={isCreating}
        form={newConnection}
        onClose={onClose}
        onSubmit={handleCreate}
        onChange={setNewConnection}
      />

      <DeleteConnectionDialog isOpen={isDeleteOpen} onClose={onDeleteClose} onConfirm={handleDelete} cancelRef={cancelRef} />
    </Box>
  );
}
