package org.phoenix.giteye.core.git.services;

import org.phoenix.giteye.core.beans.BranchBean;
import org.phoenix.giteye.core.beans.CommitBean;
import org.phoenix.giteye.core.beans.RepositoryBean;
import org.phoenix.giteye.json.JsonRepository;

import java.util.List;

/**
 * Created with IntelliJ IDEA.
 * User: phoenix
 * Date: 2/27/13
 * Time: 11:31 PM
 * To change this template use File | Settings | File Templates.
 */
public interface GitService {
    List<CommitBean> getLog(RepositoryBean repository);

    List<BranchBean> getBranches(RepositoryBean repository);

    JsonRepository getLogAsJson(RepositoryBean repository);
}
