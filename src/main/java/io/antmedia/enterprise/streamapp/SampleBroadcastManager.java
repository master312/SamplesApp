package io.antmedia.enterprise.streamapp;

import io.antmedia.AntMediaApplicationAdapter;
import io.antmedia.datastore.db.DataStore;
import io.antmedia.datastore.db.DataStoreFactory;
import io.antmedia.datastore.db.IDataStoreFactory;
import io.antmedia.datastore.db.types.Broadcast;
import io.vertx.core.Vertx;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;

import java.util.List;

public class SampleBroadcastManager implements ApplicationContextAware {

    protected static Logger logger = LoggerFactory.getLogger(SampleBroadcastManager.class);

    private static final int PAGE_SIZE = 100;
    private static final long MAX_STREAM_TIME_MS = 10 * 60 * 1000;

    private ApplicationContext applicationContext;
    private AntMediaApplicationAdapter appAdaptor;
    private Vertx vertx;

    @Override
    public void setApplicationContext(@NotNull ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
        this.vertx = this.getApplication().getVertx();
        logger.info("Setting app context");


        this.vertx.setPeriodic(30000, id -> {
            this.killOldStreams();
        });

    }

    public ApplicationContext getApplicationContext() {
        return applicationContext;
    }

    public AntMediaApplicationAdapter getApplication() {
        if (this.appAdaptor == null) {
            this.appAdaptor = (AntMediaApplicationAdapter) applicationContext.getBean(AntMediaApplicationAdapter.BEAN_NAME);
        }

        return this.appAdaptor;
    }

    public DataStore getDataStore(){
        DataStoreFactory dataStoreFactory = (DataStoreFactory) applicationContext.getBean(IDataStoreFactory.BEAN_NAME);
        return dataStoreFactory.getDataStore();
    }

    private void killOldStreams() {
        int offset = 0;
        long now = System.currentTimeMillis();
        boolean hasMorePages = true;

        long broadcastCount = getApplication().getDataStore().getTotalBroadcastNumber();

        while (hasMorePages) {
            List<Broadcast> broadcastList = getApplication().getDataStore().getBroadcastList(
                    offset,
                    PAGE_SIZE,
                    "",         // search
                    "date",     // orderBy
                    "asc",     // sort
                    ""          // status (get all statuses)
            );

            // Check if the list is empty or null, which means no more broadcasts
            if (broadcastList == null || broadcastList.isEmpty()) {
                hasMorePages = false;
                break;
            }

            for (Broadcast broadcast : broadcastList) {
                long creationTime = broadcast.getDate();
                if (now - creationTime > MAX_STREAM_TIME_MS) {
                    logger.info("Killed old stream: {}", broadcast.getStreamId());
                    getApplication().stopStreaming(broadcast, true, "");
                    getDataStore().delete(broadcast.getStreamId());
                } else {
                    // OPTIMIZATION: Since the list is sorted by "asc" (oldest first),
                    // if this stream is NOT old enough, no subsequent stream will need to be killed
                    hasMorePages = false;
                    break;
                }
            }

            if (hasMorePages) {
                offset += PAGE_SIZE;
            }

            if (offset >= broadcastCount) {
                hasMorePages = false;
            }
        }
    }

}
