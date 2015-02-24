package com.storm.batch.procesing;

import backtype.storm.Config;
import backtype.storm.LocalCluster;
import backtype.storm.generated.AlreadyAliveException;
import backtype.storm.generated.InvalidTopologyException;
import backtype.storm.spout.SchemeAsMultiScheme;
import backtype.storm.task.OutputCollector;
import backtype.storm.task.TopologyContext;
import backtype.storm.topology.IRichBolt;
import backtype.storm.topology.OutputFieldsDeclarer;
import backtype.storm.topology.TopologyBuilder;
import backtype.storm.tuple.Fields;
import backtype.storm.tuple.Tuple;
import backtype.storm.tuple.Values;
import storm.kafka.*;

import java.util.Map;

/**
 * Created by mohit on 18/12/14.
 */
public class kafkaTopology {
    public static class PrinterBolt implements IRichBolt {
        private OutputCollector _collector;

        public void prepare(Map conf, TopologyContext context, OutputCollector collector) {
            _collector = collector;
        }

        public void execute(Tuple tuple) {
            String line = tuple.getString(0);
            _collector.emit(tuple, new Values(EsperTestBean.parse(line)));
            _collector.ack(tuple);
        }

        public void cleanup() {
        }

        public void declareOutputFields(OutputFieldsDeclarer declarer) {
            declarer.declare(new Fields("word"));
        }

        public Map getComponentConfiguration() {
            return null;
        }

    }

    public static void main(String x[]) throws AlreadyAliveException, InvalidTopologyException {

        BrokerHosts brokerHosts = new ZkHosts("localhost:2181", "/brokers");
        SpoutConfig spoutConfig = new SpoutConfig(brokerHosts, // list of Kafka
                "test", // topic to read from
                "", // the root path in Zookeeper for the spout to
                "storm"); // an id for this consumer for storing the
        spoutConfig.scheme = new SchemeAsMultiScheme(new StringScheme());
        KafkaSpout kafkaSpout = new KafkaSpout(spoutConfig);

        TopologyBuilder builder = new TopologyBuilder();
        builder.setSpout("spout", kafkaSpout, 1);
        builder.setBolt("printerBolt", new PrinterBolt()).shuffleGrouping("spout");
        builder.setBolt("esperBolt", new ProcessLineEsperBolt()).shuffleGrouping("printerBolt");
        Config conf = new Config();
        conf.setDebug(true);
        conf.put("kafka.spout.topic", "test");
        conf.put("kafka.zookeeper.connect", "127.0.0.1:2181");
        conf.put("kafka.consumer.timeout.ms", 100);
        LocalCluster cluster = new LocalCluster();
        cluster.submitTopology("symbolCounter", conf, builder.createTopology());
    }

}
