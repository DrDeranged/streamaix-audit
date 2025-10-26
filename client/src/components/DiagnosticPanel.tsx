import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Server, Activity, Clock } from 'lucide-react';

interface HttpResponse {
  url: string;
  method: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  error?: string;
  timing: number;
  timestamp: string;
}

export function DiagnosticPanel() {
  const [responses, setResponses] = useState<HttpResponse[]>([]);
  const [testing, setTesting] = useState<string | null>(null);

  const testEndpoint = async (url: string, method: 'GET' | 'POST', body?: any) => {
    setTesting(url);
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        ...(body && { body: JSON.stringify(body) }),
      });

      const timing = Date.now() - startTime;
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      let responseBody;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }

      const result: HttpResponse = {
        url,
        method,
        status: response.status,
        statusText: response.statusText,
        headers,
        body: responseBody,
        timing,
        timestamp: new Date().toISOString(),
      };

      setResponses(prev => [result, ...prev]);
    } catch (error: any) {
      const result: HttpResponse = {
        url,
        method,
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: null,
        error: error.message,
        timing: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
      setResponses(prev => [result, ...prev]);
    } finally {
      setTesting(null);
    }
  };

  const clearResults = () => setResponses([]);

  return (
    <Card className="w-full border-purple-500/30 bg-slate-900/40 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-400">
          <Activity className="h-5 w-5" />
          Production Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => testEndpoint('/api/diagnostic-probe-v2', 'GET')}
            disabled={testing === '/api/diagnostic-probe-v2'}
            variant="outline"
            className="text-xs"
            data-testid="button-test-diagnostic-probe"
          >
            {testing === '/api/diagnostic-probe-v2' ? 'Testing...' : 'Test Diagnostic Probe'}
          </Button>
          
          <Button
            onClick={() => testEndpoint('/api/health', 'GET')}
            disabled={testing === '/api/health'}
            variant="outline"
            className="text-xs"
            data-testid="button-test-health"
          >
            {testing === '/api/health' ? 'Testing...' : 'Test Health Check'}
          </Button>
          
          <Button
            onClick={() => testEndpoint('/api/test-post-simple', 'POST', { test: 'data' })}
            disabled={testing === '/api/test-post-simple'}
            variant="outline"
            className="text-xs"
            data-testid="button-test-post-simple"
          >
            {testing === '/api/test-post-simple' ? 'Testing...' : 'Test Simple POST'}
          </Button>
          
          <Button
            onClick={() => testEndpoint('/api/test-post-echo', 'POST', { message: 'hello from production' })}
            disabled={testing === '/api/test-post-echo'}
            variant="outline"
            className="text-xs"
            data-testid="button-test-post-echo"
          >
            {testing === '/api/test-post-echo' ? 'Testing...' : 'Test Echo POST'}
          </Button>
          
          <Button
            onClick={() => testEndpoint('/api/analyze-content', 'POST', { url: 'https://www.youtube.com/watch?v=test' })}
            disabled={testing === '/api/analyze-content'}
            variant="outline"
            className="text-xs col-span-2 bg-purple-500/20"
            data-testid="button-test-analyze-content"
          >
            {testing === '/api/analyze-content' ? 'Testing...' : 'Test /api/analyze-content (Current Issue)'}
          </Button>
        </div>

        {responses.length > 0 && (
          <Button
            onClick={clearResults}
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            data-testid="button-clear-results"
          >
            Clear Results
          </Button>
        )}

        {/* Response Display */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {responses.map((resp, idx) => (
            <Card key={idx} className={`border ${
              resp.status >= 200 && resp.status < 300 
                ? 'border-green-500/50 bg-green-500/5' 
                : resp.status >= 400 
                ? 'border-red-500/50 bg-red-500/5'
                : 'border-yellow-500/50 bg-yellow-500/5'
            }`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {resp.status >= 200 && resp.status < 300 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-mono text-xs">{resp.method}</span>
                    <Badge variant={resp.status >= 200 && resp.status < 300 ? 'default' : 'destructive'}>
                      {resp.status || 'ERR'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {resp.timing}ms
                  </div>
                </div>
                <div className="text-xs font-mono truncate text-muted-foreground">
                  {resp.url}
                </div>
              </CardHeader>
              <CardContent className="pt-2 space-y-2">
                {/* Server Version Headers */}
                {resp.headers['x-server-version'] && (
                  <div className="bg-purple-500/10 p-2 rounded text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <Server className="h-3 w-3 text-purple-400" />
                      <span className="text-purple-400 font-semibold">Server Info:</span>
                    </div>
                    <div className="font-mono text-[10px] space-y-0.5 pl-5">
                      <div>Version: {resp.headers['x-server-version']}</div>
                      <div>Build: {resp.headers['x-server-build-time']}</div>
                      <div>Env: {resp.headers['x-server-node-env']}</div>
                    </div>
                  </div>
                )}

                {/* Response Body */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground">Response Body:</div>
                  <pre className="text-[10px] bg-black/30 p-2 rounded overflow-x-auto max-h-40">
                    {resp.error ? (
                      <span className="text-red-400">Error: {resp.error}</span>
                    ) : (
                      JSON.stringify(resp.body, null, 2)
                    )}
                  </pre>
                </div>

                {/* Key Headers */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground">Key Headers:</div>
                  <div className="text-[10px] font-mono space-y-0.5">
                    {Object.entries(resp.headers)
                      .filter(([key]) => 
                        key.toLowerCase().includes('content-type') || 
                        key.toLowerCase().includes('x-') ||
                        key.toLowerCase().includes('server')
                      )
                      .map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="text-foreground">{value}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground">
                  Tested at: {new Date(resp.timestamp).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {responses.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Click a button above to test production endpoints</p>
            <p className="text-xs mt-1">This will reveal exactly what the server returns</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
