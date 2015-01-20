package com.storm.batch.procesing;

import backtype.storm.task.OutputCollector;
import backtype.storm.task.TopologyContext;
import backtype.storm.topology.OutputFieldsDeclarer;
import backtype.storm.topology.base.BaseRichBolt;
import backtype.storm.tuple.Tuple;
import com.espertech.esper.client.*;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import java.util.List;
import java.util.Map;


public class ProcessLineEsperBolt extends BaseRichBolt {

    private static final long serialVersionUID = 1L;
    private static final Log log = LogFactory.getLog(ProcessLineEsperBolt.class);

    private OutputCollector collector;
    private EPServiceProvider epService;

    @SuppressWarnings("rawtypes")
    @Override
    public void prepare(Map stormConf, TopologyContext context,
                        OutputCollector collector) {
        this.collector = collector;
        this.setUpEsper();
    }

    private void setUpEsper() {
        Configuration configuration = new Configuration();
        configuration.addEventType("EsperTestBean", EsperTestBean.class.getName());

        epService = EPServiceProviderManager.getDefaultProvider(configuration);
        epService.initialize();

        EPStatement visitorsStatement = epService.getEPAdministrator().
                createEPL("select  line as found from EsperTestBean.win:time(1 min) output snapshot every 1 minute");
        visitorsStatement.addListener(new UpdateListener() {

            @Override
            public void update(EventBean[] newEvents, EventBean[] oldEvents) {
                if (newEvents != null) {
                    System.out.println("Batch Length::::::::::::::::::::::" + newEvents.length);
                    for (EventBean e : newEvents) {
                        System.out.println("online ----------------------------------------------line: " + e.get("found"));
                    }
                }
            }

        });
    }

    @Override
    public void execute(Tuple input) {
        List<Object> values = input.getValues();
        epService.getEPRuntime().sendEvent(values.get(0));
        collector.ack(input);
    }

    /**
     * 没有后续的 bolt，所以这个方法可以不实现
     */
    @Override
    public void declareOutputFields(OutputFieldsDeclarer declarer) {

    }

}