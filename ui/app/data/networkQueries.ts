/**
 * DQL queries for NOC Dashboard live mode.
 *
 * These are the same queries used in the Network Observability Console,
 * adapted for the customer-facing dashboard.
 */

export const NETWORK_QUERIES = {
  /** Device inventory table */
  deviceInventory: [
    `fetch \`dt.entity.network:device\``,
    `| fieldsAdd deviceName = entity.name`,
    `| fieldsAdd ip = entity.name`,
    `| fieldsAdd deviceType = ""`,
    `| lookup [`,
    `  timeseries cpuPerc=avg(com.dynatrace.extension.network_device.cpu_usage), by:{\`dt.entity.network:device\`}`,
    `  | fieldsAdd cpuMax = arrayMax(cpuPerc)`,
    `], sourceField:id, lookupField:\`dt.entity.network:device\`, prefix:"cpu."`,
    `| lookup [`,
    `  timeseries {`,
    `    memUsed=sum(com.dynatrace.extension.network_device.memory_used),`,
    `    memFree=sum(com.dynatrace.extension.network_device.memory_free),`,
    `    memTotal=sum(com.dynatrace.extension.network_device.memory_total),`,
    `    memUsage=avg(com.dynatrace.extension.network_device.memory_usage)`,
    `  }, by:{\`dt.entity.network:device\`}`,
    `  | fieldsAdd memPct = coalesce(`,
    `      arrayMax(memUsage),`,
    `      arrayMax(memUsed) / arrayMax(memTotal) * 100`,
    `    )`,
    `], sourceField:id, lookupField:\`dt.entity.network:device\`, prefix:"mem."`,
    `| lookup [`,
    `  fetch dt.davis.problems`,
    `  | expand affected_entity_ids`,
    `  | filter startsWith(affected_entity_ids, "CUSTOM_DEVICE")`,
    `  | summarize problems=countDistinct(display_id), by:{affected_entity_ids}`,
    `], sourceField:id, lookupField:affected_entity_ids, prefix:"p."`,
    `| fieldsAdd cpuPct = cpu.cpuMax, memPct = mem.memPct, problems = coalesce(p.problems, 0)`,
    `| fields id, deviceName, ip, deviceType, cpuPct, memPct, problems`,
    `| sort problems desc`,
  ].join('\n'),

  /** Interface health table */
  interfaceHealth: [
    `timeseries {`,
    `  ifInBytes = sum(com.dynatrace.extension.network_device.if.bytes_in.count),`,
    `  ifOutBytes = sum(com.dynatrace.extension.network_device.if.bytes_out.count)`,
    `}, by:{\`dt.entity.network:device\`, \`dt.entity.network:interface\`}`,
    `| fieldsAdd inTrafficBps = coalesce(arrayMax(ifInBytes), 0) * 8 / 300`,
    `| fieldsAdd outTrafficBps = coalesce(arrayMax(ifOutBytes), 0) * 8 / 300`,
    `| fieldsAdd inLoad = inTrafficBps / 1000000000 * 100`,
    `| fieldsAdd outLoad = outTrafficBps / 1000000000 * 100`,
    `| lookup [`,
    `  fetch \`dt.entity.network:device\` | fieldsAdd deviceName = entity.name`,
    `], sourceField:\`dt.entity.network:device\`, lookupField:id, prefix:"d."`,
    `| lookup [`,
    `  fetch \`dt.entity.network:interface\` | fieldsAdd interfaceName = entity.name`,
    `], sourceField:\`dt.entity.network:interface\`, lookupField:id, prefix:"if."`,
    `| lookup [`,
    `  timeseries status=avg(com.dynatrace.extension.network_device.if.status), by:{\`dt.entity.network:interface\`}`,
    `  | fieldsAdd currentStatus = arrayMax(status)`,
    `], sourceField:\`dt.entity.network:interface\`, lookupField:\`dt.entity.network:interface\`, prefix:"s."`,
    `| fieldsAdd ifStatus = if(toDouble(s.currentStatus) >= 1.0, "up", else: "down")`,
    `| lookup [`,
    `  timeseries {`,
    `    errIn=sum(com.dynatrace.extension.network_device.if.in.errors.count),`,
    `    errOut=sum(com.dynatrace.extension.network_device.if.out.errors.count),`,
    `    discIn=sum(com.dynatrace.extension.network_device.if.in.discards.count),`,
    `    discOut=sum(com.dynatrace.extension.network_device.if.out.discards.count)`,
    `  }, by:{\`dt.entity.network:interface\`}`,
    `  | fieldsAdd errorsIn = arraySum(errIn), errorsOut = arraySum(errOut)`,
    `  | fieldsAdd discardsIn = arraySum(discIn), discardsOut = arraySum(discOut)`,
    `], sourceField:\`dt.entity.network:interface\`, lookupField:\`dt.entity.network:interface\`, prefix:"e."`,
    `| fields \`dt.entity.network:interface\`, if.interfaceName, d.deviceName, ifStatus, inLoad, outLoad, inTrafficBps, outTrafficBps, e.errorsIn, e.errorsOut, e.discardsIn, e.discardsOut`,
    `| sort inTrafficBps desc`,
    `| limit 100`,
  ].join('\n'),

  /** Topology — network device nodes with health, CPU, memory */
  topologyNodes: [
    `fetch \`dt.entity.network:device\``,
    `| fieldsAdd deviceName = entity.name`,
    `| fieldsAdd ip = entity.name`,
    `| fieldsAdd deviceType = ""`,
    `| lookup [`,
    `  timeseries cpuPerc=avg(com.dynatrace.extension.network_device.cpu_usage), by:{\`dt.entity.network:device\`}`,
    `  | fieldsAdd cpuMax = arrayMax(cpuPerc)`,
    `], sourceField:id, lookupField:\`dt.entity.network:device\`, prefix:"cpu."`,
    `| lookup [`,
    `  timeseries memUsage=avg(com.dynatrace.extension.network_device.memory_usage), by:{\`dt.entity.network:device\`}`,
    `  | fieldsAdd memMax = arrayMax(memUsage)`,
    `], sourceField:id, lookupField:\`dt.entity.network:device\`, prefix:"mem."`,
    `| lookup [`,
    `  fetch dt.davis.problems`,
    `  | expand affected_entity_ids`,
    `  | filter startsWith(affected_entity_ids, "CUSTOM_DEVICE")`,
    `  | filter status == "OPEN"`,
    `  | summarize problems=countDistinct(display_id), by:{affected_entity_ids}`,
    `], sourceField:id, lookupField:affected_entity_ids, prefix:"p."`,
    `| fieldsAdd cpuPct = cpu.cpuMax, memPct = mem.memMax, problems = coalesce(p.problems, 0)`,
    `| fields id, deviceName, ip, deviceType, cpuPct, memPct, problems`,
    `| limit 100`,
  ].join('\n'),

  /** Topology — Smartscape neighbor edges */
  topologyEdges: [
    `smartscapeNodes EXT_NETWORK_DEVICE`,
    `| traverse { belongs_to }, { EXT_NETWORK_INTERFACE }, direction:"backward", fieldsKeep: { id, name }`,
    `| traverse { calls }, { EXT_NETWORK_INTERFACE }, direction:"forward", fieldsKeep: { id, name }`,
    `| traverse { belongs_to }, { EXT_NETWORK_DEVICE }, direction:"forward", fieldsKeep: { id, name }`,
    `| fields`,
    `    sourceDevice = id,`,
    `    sourceName = name,`,
    `    sourceInterface = dt.traverse.history[2][name],`,
    `    neighborInterface = dt.traverse.history[1][name],`,
    `    targetDevice = dt.traverse.history[0][id],`,
    `    targetName = dt.traverse.history[0][name]`,
    `| dedup sourceDevice, targetDevice`,
  ].join('\n'),

  /** Topology — BGP peer edges */
  topologyBgpEdges: [
    `timeseries bgpState = avg(com.dynatrace.extension.network_device.bgp.peer.state),`,
    `  by:{\`dt.entity.network:device\`, bgp.peer.remote_addr}`,
    `| fieldsAdd avgState = arrayAvg(bgpState)`,
    `| filter avgState > 0`,
    `| lookup [`,
    `  fetch \`dt.entity.network:device\``,
    `  | fieldsAdd mgmtIp = entity.name`,
    `  | fields id, mgmtIp`,
    `], sourceField:bgp.peer.remote_addr, lookupField:mgmtIp, prefix:"peer."`,
    `| filter isNotNull(peer.id)`,
    `| summarize bgpState = avg(avgState), by:{source = \`dt.entity.network:device\`, target = peer.id}`,
    `| fields source, target, bgpState`,
  ].join('\n'),

  /** Topology — flow-based edges (stub) */
  topologyFlowEdges: [
    `fetch \`dt.entity.network:device\``,
    `| limit 1`,
    `| filter id == "__NONE__"`,
    `| fieldsAdd source = id, target = id, traffic = 0.0`,
    `| fields source, target, traffic`,
  ].join('\n'),

  /** Device locations — devSysLocation for city mapping */
  deviceLocations: [
    `fetch \`dt.entity.network:device\``,
    `| fieldsAdd name = entity.name`,
    `| fields name, devSysLocation`,
  ].join('\n'),

  /** Cluster devices for geographic map */
  clusterDevices: [
    `fetch \`dt.entity.network:device\``,
    `| fieldsAdd deviceName = entity.name`,
    `| lookup [`,
    `  fetch dt.davis.problems`,
    `  | expand affected_entity_ids`,
    `  | filter startsWith(affected_entity_ids, "CUSTOM_DEVICE")`,
    `  | summarize problems=countDistinct(display_id), by:{affected_entity_ids}`,
    `], sourceField:id, lookupField:affected_entity_ids, prefix:"p."`,
    `| fieldsAdd problems = coalesce(p.problems, 0)`,
    `| fields id, deviceName, problems`,
  ].join('\n'),

  /* ── Full Smartscape entity queries ─────────────────── */

  /** Hosts with CPU / memory / problems */
  hosts: [
    `fetch \`dt.entity.host\``,
    `| fieldsAdd hostName = entity.name`,
    `| fieldsAdd osType = osType`,
    `| lookup [`,
    `  timeseries cpuUsage=avg(dt.host.cpu.usage), by:{dt.entity.host}`,
    `  | fieldsAdd cpuPct = arrayMax(cpuUsage)`,
    `], sourceField:id, lookupField:dt.entity.host, prefix:"cpu."`,
    `| lookup [`,
    `  timeseries memUsage=avg(dt.host.memory.usage), by:{dt.entity.host}`,
    `  | fieldsAdd memPct = arrayMax(memUsage)`,
    `], sourceField:id, lookupField:dt.entity.host, prefix:"mem."`,
    `| lookup [`,
    `  fetch dt.davis.problems`,
    `  | expand affected_entity_ids`,
    `  | filter startsWith(affected_entity_ids, "HOST")`,
    `  | summarize problems=countDistinct(display_id), by:{affected_entity_ids}`,
    `], sourceField:id, lookupField:affected_entity_ids, prefix:"p."`,
    `| fieldsAdd cpuPct = cpu.cpuPct, memPct = mem.memPct, problems = coalesce(p.problems, 0)`,
    `| fields id, hostName, osType, cpuPct, memPct, problems`,
    `| limit 100`,
  ].join('\n'),

  /** Process groups */
  processGroups: [
    `fetch \`dt.entity.process_group\``,
    `| fieldsAdd pgName = entity.name`,
    `| fieldsAdd technology = softwareTechnologies`,
    `| lookup [`,
    `  timeseries cpuUsage=avg(dt.process.cpu.usage), by:{dt.entity.process_group}`,
    `  | fieldsAdd cpuPct = arrayMax(cpuUsage)`,
    `], sourceField:id, lookupField:dt.entity.process_group, prefix:"cpu."`,
    `| lookup [`,
    `  fetch \`dt.entity.process_group_instance\``,
    `  | summarize instanceCount=count(), by:{dt.entity.process_group}`,
    `], sourceField:id, lookupField:dt.entity.process_group, prefix:"inst."`,
    `| fieldsAdd cpuPct = cpu.cpuPct, instances = coalesce(inst.instanceCount, 1)`,
    `| fields id, pgName, technology, cpuPct, instances`,
    `| limit 100`,
  ].join('\n'),

  /** Services with request rate, response time, error rate */
  services: [
    `fetch \`dt.entity.service\``,
    `| fieldsAdd serviceName = entity.name`,
    `| fieldsAdd technology = serviceType`,
    `| lookup [`,
    `  timeseries {`,
    `    reqCount=sum(dt.service.request.count),`,
    `    respTime=avg(dt.service.response.time),`,
    `    failRate=avg(dt.service.failure.rate)`,
    `  }, by:{dt.entity.service}`,
    `  | fieldsAdd reqRate = arrayMax(reqCount), respTimeMs = arrayMax(respTime) / 1000000, failPct = arrayMax(failRate) * 100`,
    `], sourceField:id, lookupField:dt.entity.service, prefix:"m."`,
    `| lookup [`,
    `  fetch dt.davis.problems`,
    `  | expand affected_entity_ids`,
    `  | filter startsWith(affected_entity_ids, "SERVICE")`,
    `  | summarize problems=countDistinct(display_id), by:{affected_entity_ids}`,
    `], sourceField:id, lookupField:affected_entity_ids, prefix:"p."`,
    `| fieldsAdd requestRate = m.reqRate, responseTime = m.respTimeMs, errorRate = m.failPct, problems = coalesce(p.problems, 0)`,
    `| fields id, serviceName, technology, requestRate, responseTime, errorRate, problems`,
    `| limit 100`,
  ].join('\n'),

  /** Applications (RUM) with apdex, user actions */
  applications: [
    `fetch \`dt.entity.application\``,
    `| fieldsAdd appName = entity.name`,
    `| fieldsAdd appType = applicationType`,
    `| lookup [`,
    `  timeseries {`,
    `    actions=sum(dt.rum.action.count),`,
    `    apdex=avg(dt.rum.apdex)`,
    `  }, by:{dt.entity.application}`,
    `  | fieldsAdd actionRate = arrayMax(actions), apdexScore = arrayMax(apdex)`,
    `], sourceField:id, lookupField:dt.entity.application, prefix:"m."`,
    `| lookup [`,
    `  fetch dt.davis.problems`,
    `  | expand affected_entity_ids`,
    `  | filter startsWith(affected_entity_ids, "APPLICATION")`,
    `  | summarize problems=countDistinct(display_id), by:{affected_entity_ids}`,
    `], sourceField:id, lookupField:affected_entity_ids, prefix:"p."`,
    `| fieldsAdd userActions = m.actionRate, apdex = m.apdexScore, problems = coalesce(p.problems, 0)`,
    `| fields id, appName, appType, userActions, apdex, problems`,
    `| limit 50`,
  ].join('\n'),

  /** Smartscape: Host → Network Device edges (runs-on) */
  hostToDeviceEdges: [
    `fetch \`dt.entity.host\``,
    `| expand runs_on = entity.detectedRelationships[\`runs_on\`]`,
    `| filter isNotNull(runs_on)`,
    `| filter startsWith(toString(runs_on), "CUSTOM_DEVICE") or startsWith(toString(runs_on), "NETWORK_DEVICE")`,
    `| fieldsAdd source = id, target = runs_on`,
    `| fields source, target`,
  ].join('\n'),

  /** Smartscape: Process group → Host edges (runs-on) */
  processToHostEdges: [
    `fetch \`dt.entity.process_group\``,
    `| expand hostId = entity.detectedRelationships[\`runs_on\`]`,
    `| filter isNotNull(hostId) and startsWith(toString(hostId), "HOST")`,
    `| fieldsAdd source = id, target = hostId`,
    `| fields source, target`,
  ].join('\n'),

  /** Smartscape: Service → Service calls edges */
  serviceCallEdges: [
    `fetch \`dt.entity.service\``,
    `| expand calledService = entity.detectedRelationships[\`calls\`]`,
    `| filter isNotNull(calledService) and startsWith(toString(calledService), "SERVICE")`,
    `| fieldsAdd source = id, target = calledService`,
    `| fields source, target`,
  ].join('\n'),

  /** Smartscape: Service → Process group (provided by) */
  serviceToProcessEdges: [
    `fetch \`dt.entity.service\``,
    `| expand pgId = entity.detectedRelationships[\`provided_by\`]`,
    `| filter isNotNull(pgId)`,
    `| fieldsAdd source = id, target = pgId`,
    `| fields source, target`,
  ].join('\n'),

  /** Smartscape: Application → Service edges */
  appToServiceEdges: [
    `fetch \`dt.entity.application\``,
    `| expand svcId = entity.detectedRelationships[\`calls\`]`,
    `| filter isNotNull(svcId) and startsWith(toString(svcId), "SERVICE")`,
    `| fieldsAdd source = id, target = svcId`,
    `| fields source, target`,
  ].join('\n'),
} as const;
