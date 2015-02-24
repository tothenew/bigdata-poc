package com.storm.batch.procesing;

public class EsperTestBean {
    String line;

    public String getLine() {
        return line;
    }

    public void setLine(String line) {
        this.line = line;
    }

    public static EsperTestBean parse(String line) {
        EsperTestBean esperTestBean = new EsperTestBean();
        esperTestBean.setLine(line);
        return esperTestBean;
    }
}
